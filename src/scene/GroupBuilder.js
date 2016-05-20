var dl = require('datalib'),
    df = require('vega-dataflow'),
    Node  = df.Node, // jshint ignore:line
    Deps  = df.Dependencies,
    Tuple = df.Tuple,
    Collector = df.Collector,
    log = require('vega-logging'),
    Builder = require('./Builder'),
    Scale = require('./Scale'),
    parseAxes = require('../parse/axes'),
    parseLegends = require('../parse/legends');

function GroupBuilder() {
  this._children = {};
  this._scaler = null;
  this._recursor = null;

  this._scales = {};
  this.scale = scale.bind(this);
  return arguments.length ? this.init.apply(this, arguments) : this;
}

var Types = GroupBuilder.TYPES = {
  GROUP:  "group",
  MARK:   "mark",
  AXIS:   "axis",
  LEGEND: "legend"
};

var proto = (GroupBuilder.prototype = new Builder());

proto.init = function(graph, def) {
  var builder = this, name;

  this._scaler = new Node(graph);

  (def.scales||[]).forEach(function(s) {
    s = builder.scale((name=s.name), new Scale(graph, s, builder));
    builder.scale(name+":prev", s);
    builder._scaler.addListener(s);  // Scales should be computed after group is encoded
  });

  this._recursor = new Node(graph);
  this._recursor.evaluate = recurse.bind(this);

  var scales = (def.axes||[]).reduce(function(acc, x) {
    acc[x.scale] = 1;
    return acc;
  }, {});

  scales = (def.legends||[]).reduce(function(acc, x) {
    acc[x.size || x.shape || x.fill || x.stroke || x.opacity] = 1;
    return acc;
  }, scales);

  this._recursor.dependency(Deps.SCALES, dl.keys(scales));

  // We only need a collector for up-propagation of bounds calculation,
  // so only GroupBuilders, and not regular Builders, have collectors.
  this._collector = new Collector(graph);

  return Builder.prototype.init.apply(this, arguments);
};

proto.evaluate = function() {
  var output  = Builder.prototype.evaluate.apply(this, arguments),
      model   = this._graph,
      builder = this,
      scales = this._scales,
      items  = this._mark.items;

  // If scales need to be reevaluated, we need to send all group items forward.
  if (output.mod.length < items.length) {
    var fullUpdate = dl.keys(scales).some(function(s) {
      return scales[s].reevaluate(output);
    });

    if (!fullUpdate && this._def.axes) {
      fullUpdate = this._def.axes.reduce(function(acc, a) {
        return acc || output.scales[a.scale];
      }, false);
    }

    if (!fullUpdate && this._def.legends) {
      fullUpdate = this._def.legends.reduce(function(acc, l) {
        return acc || output.scales[l.size || l.shape || l.fill || l.stroke];
      }, false);
    }

    if (fullUpdate) {
      output.mod = output.mod.concat(Tuple.idFilter(items,
          output.mod, output.add, output.rem));
    }
  }

  output.add.forEach(function(group) { buildGroup.call(builder, output, group); });
  output.rem.forEach(function(group) { model.group(group._id, null); });
  return output;
};

proto.pipeline = function() {
  return [this, this._scaler, this._recursor, this._collector, this._bounder];
};

proto.disconnect = function() {
  var builder = this;
  dl.keys(builder._children).forEach(function(group_id) {
    builder._children[group_id].forEach(function(c) {
      builder._recursor.removeListener(c.builder);
      c.builder.disconnect();
    });
  });

  builder._children = {};
  return Builder.prototype.disconnect.call(this);
};

proto.child = function(name, group_id) {
  var children = this._children[group_id],
      i = 0, len = children.length,
      child;

  for (; i<len; ++i) {
    child = children[i];
    if (child.type == Types.MARK && child.builder._def.name == name) break;
  }

  return child.builder;
};

function recurse(input) {
  var builder = this,
      hasMarks = dl.array(this._def.marks).length > 0,
      hasAxes = dl.array(this._def.axes).length > 0,
      hasLegends = dl.array(this._def.legends).length > 0,
      i, j, c, len, group, pipeline, def, inline = false;

  for (i=0, len=input.add.length; i<len; ++i) {
    group = input.add[i];
    if (hasMarks) buildMarks.call(this, input, group);
    if (hasAxes)  buildAxes.call(this, input, group);
    if (hasLegends) buildLegends.call(this, input, group);
  }

  // Wire up new children builders in reverse to minimize graph rewrites.
  for (i=input.add.length-1; i>=0; --i) {
    group = input.add[i];
    for (j=this._children[group._id].length-1; j>=0; --j) {
      c = this._children[group._id][j];
      c.builder.connect();
      pipeline = c.builder.pipeline();
      def = c.builder._def;

      // This new child needs to be built during this propagation cycle.
      // We could add its builder as a listener off the _recursor node,
      // but try to inline it if we can to minimize graph dispatches.
      inline = (def.type !== Types.GROUP);
      inline = inline && (this._graph.data(c.from) !== undefined);
      inline = inline && (pipeline[pipeline.length-1].listeners().length === 1); // Reactive geom source
      inline = inline && (def.from && !def.from.mark); // Reactive geom target
      c.inline = inline;

      if (inline) this._graph.evaluate(input, c.builder);
      else this._recursor.addListener(c.builder);
    }
  }

  function removeTemp(c) {
    if (c.type == Types.MARK && !c.inline &&
        builder._graph.data(c.from) !== undefined) {
      builder._recursor.removeListener(c.builder);
    }
  }

  function updateAxis(a) {
    var scale = a.scale();
    if (!input.scales[scale.scaleName]) return;
    a.reset().def();
  }

  function updateLegend(l) {
    var scale = l.size() || l.shape() || l.fill() || l.stroke() || l.opacity();
    if (!input.scales[scale.scaleName]) return;
    l.reset().def();
  }

  for (i=0, len=input.mod.length; i<len; ++i) {
    group = input.mod[i];

    // Remove temporary connection for marks that draw from a source
    if (hasMarks) builder._children[group._id].forEach(removeTemp);

    // Update axis data defs
    if (hasAxes) group.axes.forEach(updateAxis);

    // Update legend data defs
    if (hasLegends) group.legends.forEach(updateLegend);
  }

  function disconnectChildren(c) {
    builder._recursor.removeListener(c.builder);
    c.builder.disconnect();
  }

  for (i=0, len=input.rem.length; i<len; ++i) {
    group = input.rem[i];
    // For deleted groups, disconnect their children
    builder._children[group._id].forEach(disconnectChildren);
    delete builder._children[group._id];
  }

  return input;
}

function scale(name, x) {
  var group = this, s = null;
  if (arguments.length === 2) return (group._scales[name] = x, x);
  while (s == null) {
    s = group._scales[name];
    group = group.mark ? group.mark.group : group._parent;
    if (!group) break;
  }
  return s;
}

function buildGroup(input, group) {
  log.debug(input, ["building group", group._id]);

  group._scales = group._scales || {};
  group.scale = scale.bind(group);

  group.items = group.items || [];
  this._children[group._id] = this._children[group._id] || [];

  group.axes = group.axes || [];
  group.axisItems = group.axisItems || [];

  group.legends = group.legends || [];
  group.legendItems = group.legendItems || [];

  // Index group by ID to enable safe scoped scale lookups.
  this._graph.group(group._id, group);
}

function buildMarks(input, group) {
  log.debug(input, ["building children marks #"+group._id]);
  var marks = this._def.marks,
      mark, from, inherit, i, len, b;

  for (i=0, len=marks.length; i<len; ++i) {
    mark = marks[i];
    from = mark.from || {};
    inherit = group.datum._facetID;
    group.items[i] = {group: group, _scaleRefs: {}};
    b = (mark.type === Types.GROUP) ? new GroupBuilder() : new Builder();
    b.init(this._graph, mark, group.items[i], this, group._id, inherit);
    this._children[group._id].push({
      builder: b,
      from: from.data || (from.mark ? ("vg_" + group._id + "_" + from.mark) : inherit),
      type: Types.MARK
    });
  }
}

function buildAxes(input, group) {
  var axes = group.axes,
      axisItems = group.axisItems,
      builder = this;

  parseAxes(this._graph, this._def.axes, axes, group);
  axes.forEach(function(a, i) {
    var scale = builder._def.axes[i].scale,
        def = a.def(),
        b = null;

    axisItems[i] = {group: group, axis: a, layer: def.layer};
    b = (def.type === Types.GROUP) ? new GroupBuilder() : new Builder();
    b.init(builder._graph, def, axisItems[i], builder)
      .dependency(Deps.SCALES, scale);
    builder._children[group._id].push({ builder: b, type: Types.AXIS, scale: scale });
  });
}

function buildLegends(input, group) {
  var legends = group.legends,
      legendItems = group.legendItems,
      builder = this;

  parseLegends(this._graph, this._def.legends, legends, group);
  legends.forEach(function(l, i) {
    var scale = l.size() || l.shape() || l.fill() || l.stroke() || l.opacity(),
        def = l.def(),
        b = null;

    legendItems[i] = {group: group, legend: l};
    b = (def.type === Types.GROUP) ? new GroupBuilder() : new Builder();
    b.init(builder._graph, def, legendItems[i], builder)
      .dependency(Deps.SCALES, scale);
    builder._children[group._id].push({ builder: b, type: Types.LEGEND, scale: scale });
  });
}

module.exports = GroupBuilder;
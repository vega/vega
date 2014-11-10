define(function(require, exports, module) {
  var tuple = require('../core/tuple'), 
      changeset = require('../core/changeset'), 
      collector = require('../transforms/collector'), 
      encode = require('./encode'), 
      bounds = require('./bounds'), 
      scalefn = require('./scale'),
      parseAxes = require('../parse/axes'),
      constants = require('../util/constants'),
      util = require('../util/index');

  function ids(a) {
    return a.reduce(function(m,x) {
      return (m[x._id] = 1, m);
    }, {});
  };

  // Recurse up to look for scales.
  function scale(name) {
    var group = this, scale = null;
    while(scale == null) {
      scale = group.scales[name];
      group = group.mark ? group.mark.group : group.parent;
      if(!group) break;
    }
    return scale;
  };

  function pipelines() {
    var b = this, sc = Object.keys(b.scales), 
        p = [b, b.encoder],
        pipelines = [];

    // Add scale recalculators after the group is encoded
    sc = sc.map(function(s) { return p.concat(b.scales[s]); });
    pipelines.push.apply(pipelines, sc);

    // Add axes builders once the scales have been recalculated
    if(b.def.type == constants.GROUP) {
      pipelines.push(p.concat([b.axes, b.collector, b.bounder, b.renderer]));
    } else {
      pipelines.push(p.concat([b.collector, b.bounder, b.renderer]));
    }

    return pipelines;
  };

  function connect(model) { 
    var b = this;
    if(b.encoder._deps.scales.length) {
      b.encoder._deps.scales.forEach(function(s) {
        b.parent.scale(s).addListener(b);
      });
    }

    if(b.parent) {
      b.bounder.addListener(b.parent.collector);
      b.parent.addListener(b); // Temp connection to propagate initial pulse.
    }

    pipelines.call(b).forEach(function(p) { model.graph.connect(p) });
  };

  function disconnect(model) { 
    var b = this;
    if(b.encoder._deps.scales.length) {
      b.encoder._deps.scales.forEach(function(s) {
        b.parent.scale(s).removeListener(b);
      });
    }

    pipelines.call(b).forEach(function(p) { model.graph.disconnect(p) }); 
  };

  return function build(model, renderer, def, mark, parent, inheritFrom) {
    var items = [],     // Item nodes in the scene graph
        children = [],  // Group's children dataflow graph nodes
        scales = {},    // Scale nodes in the dataflow graph
        f = def.from || inheritFrom,
        from = util.isString(f) ? model.data(f) : null,
        builder, lastBuild = 0;  

    function init() {
      mark.def = def;
      mark.marktype = def.type;
      mark.interactive = !(def.interactive === false);
      mark.items = items; 

      builder = new model.Node(function(input) {
        global.debug(input, ["building", f, def.type]);

        // Only the first pulse should come from the parent.
        // Future pulses will propagate from dependencies.
        if(builder.parent && !lastBuild && from) 
          builder.parent.removeListener(builder);

        return buildItems(input);
      });
      builder._router = true;
      builder._touchable = true;
      if(from) builder._deps.data.push(f);

      builder.def       = def;
      builder.parent    = parent; // Parent builder (dataflow graph node)
      builder.encoder   = encode(model, mark);
      builder.collector = collector(model);
      builder.bounder   = bounds(model, mark);
      builder.renderer  = renderer;
      builder.scales    = scales;
      builder.scale     = scale.bind(builder);
      (def.scales||[]).forEach(function(s) { scales[s.name] = scalefn(model, s); });
      builder.axes = buildAxes();

      if(from) builder.encoder._deps.data.push(f); 
      connect.call(builder, model);

      return builder;
    };

    function newItem(d, stamp) {
      var item = tuple.create(null);
      tuple.set(item, "mark", mark);
      tuple.set(item, "datum", d);

      item.touch = function() {
        if (this.pathCache) this.pathCache = null;
        if (this.mark.pathCache) this.mark.pathCache = null;
      };

      // For the root node's item
      if(def.width)  tuple.set(item, "width",  def.width);
      if(def.height) tuple.set(item, "height", def.height);

      items.push(item); 

      if(def.type == constants.GROUP) buildGroup(item);

      return item;
    };

    function buildItems(input) {
      var fcs, output = changeset.create(input),
          fullUpdate = builder.encoder.reevaluate(input);

      // If a scale or signal in the update propset has been updated, 
      // send forward all items for reencoding.
      if(fullUpdate) output.mod = items.slice();

      if(from) {
        fcs = from._output;
        if(!fcs) return output.touch = true, output;
        if(fcs.stamp <= lastBuild) return output;

        var mod = ids(fcs.mod), rem = ids(fcs.rem),
            i, d, item, c;

        for(var i = items.length-1; i >= 0; i--) {
          item = items[i], d = item.datum;

          if(mod[d._id] === 1 && !fullUpdate) output.mod.push(item);
          else if(rem[d._id] === 1) {
            output.rem.push.apply(output.rem, items.splice(i, 1)[0]);

            // Facet's disconnect will remove Graph.db listener, but we 
            // should disconnect the scenegraph builder pipelines.
            if(def.type == constants.GROUP) 
              disconnect.call(children.splice(i, 1)[0], model);
          }
        }

        output.add = fcs.add.map(function(d) { return newItem(d, fcs.stamp); });        
        lastBuild = fcs.stamp;
      } else {
        if(util.isFunction(def.from)) {
          output.rem = items.splice(0);
          def.from().forEach(function(d) { output.add.push(newItem(d, input.stamp)); });
        } else {
          if(!items.length) output.add.push(newItem(constants.DEFAULT_DATA, input.stamp));
          else if(!fullUpdate) output.mod.push(items[0]);
        }
      }

      // TODO: any need to respect input.sort with items?

      return output;
    };

    function buildGroup(group) {
      var marks = def.marks,
          axex = null,
          i, m, b;

      group.scales = group.scales || {};    
      group.scale = scale.bind(group);

      group.items = group.items || [];
      for(i = 0; i < marks.length; i++) {
        group.items[i] = {group: group};
        b = build(model, renderer, marks[i], group.items[i], builder, "vg_"+group.datum._id);
        children.push(b);
      }
    };

    function buildAxes() {
      var node;
      return node = new model.Node(function(input) {
        global.debug(input, ["building axes"]);
        if(!def.axes) return input;

        input.add.forEach(function(group) {
          axes = group.axes || (group.axes = []);
          axisItems = group.axisItems || (group.axisItems = []);
          parseAxes(def.axes, axes, group);
          axes.forEach(function(a, i) {
            axisItems[i] = {group: group, axisDef: a.def()};
            b = build(model, renderer, axisItems[i].axisDef, axisItems[i], builder);
            b._deps.scales.push(def.axes[i].scale);
            node.addListener(b);
            children.push(b);
          });
        });

        input.mod.forEach(function(group) {
          // Reparse axes to feed them new data from reevaluated scales
          parseAxes(def.axes, group.axes, group);
          group.axes.forEach(function(a) { a.def() });
        });

        var scales = (def.axes||[]).reduce(function(acc, x) {
          return (acc[x.scale] = 1, acc);
        }, {});
        node._deps.scales = util.keys(scales);

        return input;
      });
    };

    return init();
  };
});
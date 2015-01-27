define(function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      Builder = require('./Builder'),
      scalefn = require('./scale'),
      parseAxes = require('../parse/axes'),
      util = require('../util/index'),
      C = require('../util/constants');

  function GroupBuilder() {
    this._children = {};
    this._scaler = null;
    this._recursor = null;

    this._scales = {};
    this.scale = scale.bind(this);
    return arguments.length ? this.init.apply(this, arguments) : this;
  }

  var proto = (GroupBuilder.prototype = new Builder());

  proto.init = function(model, renderer, def, mark, parent, inheritFrom) {
    var builder = this;

    this._scaler = new Node(model.graph);

    (def.scales||[]).forEach(function(s) { 
      s = builder.scale(s.name, scalefn(model, s));
      s.dependency(C.DATA).forEach(function(d) { model.data(d).addListener(builder); });
      s.dependency(C.SIGNALS).forEach(function(s) { model.signal(s).addListener(builder); });
      builder._scaler.addListener(s);  // Scales should be computed after group is encoded
    });

    this._recursor = new Node(model.graph);
    this._recursor.evaluate = recurse.bind(this);

    return Builder.prototype.init.apply(this, arguments);
  };

  proto._pipeline = function() {
    return [this, this._encoder, this._scaler, this._recursor, this._collector, this._bounder, this._renderer];
  };

  proto.disconnect = function() {
    var builder = this;
    util.keys(builder._children).forEach(function(group_id) {
      builder._children[group_id].forEach(function(c) {
        builder._recursor.removeListener(c.builder);
        c.builder.disconnect();
      })
    });

    builder._children = {};
    return Builder.prototype.disconnect.call(this);
  };

  proto.evaluate = function(input) {
    var output = Builder.prototype.evaluate.apply(this, arguments),
        builder = this;

    output.add.forEach(function(group) { buildGroup.call(builder, output, group); });
    return output;
  };

  function recurse(input) {
    var builder = this;

    input.add.forEach(function(group) {
      buildMarks.call(builder, input, group);
      buildAxes.call(builder, input, group);
    });

    input.mod.forEach(function(group) {
      // Remove temporary connection for marks that draw from a source
      builder._children[group._id].forEach(function(c) {
        if(c.type == C.MARK && builder._model.data(c.from) !== undefined) {
          builder._recursor.removeListener(c.builder);
        }
      });

      // Update axes data defs
      parseAxes(builder._model, builder._def.axes, group.axes, group);
      group.axes.forEach(function(a, i) { a.def() });
    });

    input.rem.forEach(function(group) {
      // For deleted groups, disconnect their children
      builder._children[group._id].forEach(function(c) { 
        builder._recursor.removeListener(c.builder);
        c.builder.disconnect(); 
      });
      delete builder._children[group._id];
    });

    return input;
  };

  function scale(name, scale) {
    var group = this;
    if(arguments.length === 2) return (group._scales[name] = scale, scale);
    while(scale == null) {
      scale = group._scales[name];
      group = group.mark ? group.mark.group : group._parent;
      if(!group) break;
    }
    return scale;
  }

  function buildGroup(input, group) {
    util.debug(input, ["building group", group]);

    group._scales = group._scales || {};    
    group.scale  = scale.bind(group);

    group.items = group.items || [];
    this._children[group._id] = this._children[group._id] || [];

    group.axes = group.axes || [];
    group.axisItems = group.axisItems || [];
  }

  function buildMarks(input, group) {
    util.debug(input, ["building marks", this._def.marks]);
    var marks = this._def.marks,
        mark, inherit, i, len, m, b;

    for(i=0, len=marks.length; i<len; ++i) {
      mark = marks[i];
      inherit = "vg_"+group.datum._id;
      group.items[i] = {group: group};
      b = (mark.type === C.GROUP) ? new GroupBuilder() : new Builder();
      b.init(this._model, this._renderer, mark, group.items[i], this, inherit);

      // Temporary connection to propagate initial pulse. 
      this._recursor.addListener(b);
      this._children[group._id].push({ 
        builder: b, 
        from: ((mark.from||{}).data) || inherit, 
        type: C.MARK 
      });
    }
  }

  function buildAxes(input, group) {
    var axes = group.axes,
        axisItems = group.axisItems,
        builder = this;

    parseAxes(this._model, this._def.axes, axes, group);
    axes.forEach(function(a, i) {
      var scale = builder._def.axes[i].scale,
          def = a.def(),
          b = null;

      axisItems[i] = {group: group, axisDef: def};
      b = (def.type === C.GROUP) ? new GroupBuilder() : new Builder();
      b.init(builder._model, builder._renderer, def, axisItems[i], builder);
      b.dependency(C.SCALES, scale);
      builder._recursor.addListener(b);
      builder._children[group._id].push({ builder: b, type: C.AXIS, scale: scale });
    });
  }

  return GroupBuilder;
});
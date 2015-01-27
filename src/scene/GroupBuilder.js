define(function(require, exports, module) {
  var Builder = require('./Builder'),
      scalefn = require('./scale'),
      parseAxes = require('../parse/axes'),
      util = require('../util/index'),
      C = require('../util/constants');

  function GroupBuilder() {
    this._children = {};

    this.scales = {};
    this.scale = lookupScale.bind(this);
    return arguments.length ? this.init.apply(this, arguments) : this;
  }

  var proto = (GroupBuilder.prototype = new Builder());

  proto.init = function(model, renderer, def, mark, parent, inheritFrom) {
    var builder = Builder.prototype.init.apply(this, arguments);

    (def.scales||[]).forEach(function(s) { 
      s = builder._scales[s.name] = scalefn(model, s);
      s.dependency(C.DATA).forEach(function(d) { model.data(d).addListener(builder); });
      s.dependency(C.SIGNALS).forEach(function(s) { model.signal(s).addListener(builder); });
      builder._encoder.addListener(s);  // Scales should be computed after group is encoded
    });

    return this;
  };

  proto.evaluate = function(input) {
    var output = Builder.prototype.evaluate.apply(this, arguments),
        builder = this;

    output.add.forEach(function(group) {
      buildGroup.call(builder, group);
      buildMarks.call(builder, group);
    });

    output.mod.forEach(function(group) {
      // Remove temporary connection for marks that draw from a source
      builder._children[group._id].forEach(function(c) {
        if(c.type == C.MARK && builder._model.data(c.from) !== undefined) {
          builder._encoder.removeListener(c.builder);
        }
      });

      // Update axes data defs
      parseAxes(builder._model, builder._def.axes, group.axes, group);
      group.axes.forEach(function(a, i) { a.def() });
    });

    output.rem.forEach(function(group) {
      // For deleted groups, disconnect their children
      builder._children[group._id].forEach(function(c) { 
        builder._encoder.removeListener(c.builder);
        c.builder.disconnect(); 
      });
      delete builder._children[group._id];
    });

    return output;
  };

  proto.disconnect = function() {
    var builder = this;
    util.keys(builder._children).forEach(function(group_id) {
      builder._children[group_id].forEach(function(c) {
        builder._encoder.removeListener(c.builder);
        c.builder.disconnect();
      })
    });

    builder._children = {};
    return Builder.prototype.disconnect.call(this);
  };

  function lookupScale(name) {
    var group = this, scale = null;
    while(scale == null) {
      scale = group.scales[name];
      group = group.mark ? group.mark.group : (group.parent||{}).group;
      if(!group) break;
    }
    return scale;
  }

  function buildGroup(group) {
    util.debug(input, ["building group", group]);

    group.scales = group.scales || {};    
    group.scale  = lookupScale.bind(group);

    group.items = group.items || [];
    this._children[group._id] = this._children[group._id] || [];

    group.axes = group.axes || [];
    group.axisItems = group.axisItems || [];
  }

  function buildMarks(group) {
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
      this._encoder.addListener(b);
      this._children[group._id].push({ 
        builder: b, 
        from: ((mark.from||{}).data) || inherit, 
        type: C.MARK 
      });
    }
  }

  function buildAxes(group) {
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
      builder.addListener(b);
      builder._children[group._id].push({ builder: b, type: C.AXIS, scale: scale });
    });
  }


  return function group(model, def, mark, builder, parent, renderer) {
    var children = {},
        node = new model.Node(buildGroup),
        marksNode, axesNode;

    node.parent = parent;
    node.scales = {};
    node.scale  = lookupScale.bind(node);
    (def.scales||[]).forEach(function(s) { 
      s = node.scales[s.name] = scalefn(model, s);
      var dt = s._deps.data, sg = s._deps.signals;
      if(dt) dt.forEach(function(d) { model.data(d).addListener(builder); });
      if(sg) sg.forEach(function(s) { model.signal(s).addListener(builder); });
      node.addListener(s);
    });

    node.addListener(marksNode = new model.Node(buildMarks));
    node.addListener(axesNode  = new model.Node(buildAxes));

    node.disconnect = function() {
      
    };

   

    return node;
  }

});
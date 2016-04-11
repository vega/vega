var dl = require('datalib'),
    df = require('vega-dataflow'),
    ChangeSet = df.ChangeSet,
    Base = df.Graph.prototype,
    Node  = df.Node, // jshint ignore:line
    GroupBuilder = require('../scene/GroupBuilder'),
    visit = require('../scene/visit'),
    compiler = require('../parse/expr'),
    config = require('./config');

function Model(cfg) {
  this._defs = {};
  this._predicates = {};

  this._scene  = null;  // Root scenegraph node.
  this._groups = null;  // Index of group items.

  this._node = null;
  this._builder = null; // Top-level scenegraph builder.

  this._reset = {axes: false, legends: false};

  this.config(cfg);
  this.expr = compiler(this);
  Base.init.call(this);
}

var prototype = (Model.prototype = Object.create(Base));
prototype.constructor = Model;

prototype.defs = function(defs) {
  if (!arguments.length) return this._defs;
  this._defs = defs;
  return this;
};

prototype.config = function(cfg) {
  if (!arguments.length) return this._config;
  this._config = Object.create(config);
  for (var name in cfg) {
    var x = cfg[name], y = this._config[name];
    if (dl.isObject(x) && dl.isObject(y)) {
      this._config[name] = dl.extend({}, y, x);
    } else {
      this._config[name] = x;
    }
  }

  return this;
};

prototype.width = function(width) {
  if (this._defs) this._defs.width = width;
  if (this._defs && this._defs.marks) this._defs.marks.width = width;
  if (this._scene) {
    this._scene.items[0].width = width;
    this._scene.items[0]._dirty = true;
  }
  this._reset.axes = true;
  return this;
};

prototype.height = function(height) {
  if (this._defs) this._defs.height = height;
  if (this._defs && this._defs.marks) this._defs.marks.height = height;
  if (this._scene) {
    this._scene.items[0].height = height;
    this._scene.items[0]._dirty = true;
  }
  this._reset.axes = true;
  return this;
};

prototype.node = function() {
  return this._node || (this._node = new Node(this));
};

prototype.data = function() {
  var data = Base.data.apply(this, arguments);
  if (arguments.length > 1) {  // new Datasource
    this.node().addListener(data.pipeline()[0]);
  }
  return data;
};

function predicates(name) {
  var m = this, pred = {};
  if (!dl.isArray(name)) return this._predicates[name];
  name.forEach(function(n) { pred[n] = m._predicates[n]; });
  return pred;
}

prototype.predicate = function(name, predicate) {
  if (arguments.length === 1) return predicates.call(this, name);
  return (this._predicates[name] = predicate);
};

prototype.predicates = function() { return this._predicates; };

prototype.scene = function(renderer) {
  if (!arguments.length) return this._scene;

  if (this._builder) {
    this.node().removeListener(this._builder);
    this._builder._groupBuilder.disconnect();
  }

  var m = this,
      b = this._builder = new Node(this);

  b.evaluate = function(input) {
    if (b._groupBuilder) return input;

    var gb = b._groupBuilder = new GroupBuilder(m, m._defs.marks, m._scene={}),
        p  = gb.pipeline();

    m._groups = {};
    this.addListener(gb.connect());
    p[p.length-1].addListener(renderer);
    return input;
  };

  this.addListener(b);
  return this;
};

prototype.group = function(id, item) {
  var groups = this._groups;
  if (arguments.length === 1) return groups[id];
  return (groups[id] = item, this);
};

prototype.reset = function() {
  if (this._scene && this._reset.axes) {
    visit(this._scene, function(item) {
      if (item.axes) item.axes.forEach(function(axis) { axis.reset(); });
    });
    this._reset.axes = false;
  }
  if (this._scene && this._reset.legends) {
    visit(this._scene, function(item) {
      if (item.legends) item.legends.forEach(function(l) { l.reset(); });
    });
    this._reset.legends = false;
  }
  return this;
};

prototype.addListener = function(l) {
  this.node().addListener(l);
};

prototype.removeListener = function(l) {
  this.node().removeListener(l);
};

prototype.fire = function(cs) {
  if (!cs) cs = ChangeSet.create();
  this.propagate(cs, this.node());
};

module.exports = Model;

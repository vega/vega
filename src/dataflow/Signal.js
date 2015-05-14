var Node = require('./Node'),
    changeset = require('./changeset');

function Signal(graph, name, init) {
  Node.prototype.init.call(this, graph);
  this._name  = name;
  this._value = init;
  this._handlers = [];
  return this;
};

var proto = (Signal.prototype = new Node());

proto.name = function() { return this._name; };

proto.value = function(val) {
  if(!arguments.length) return this._value;
  this._value = val;
  return this;
};

proto.fire = function(cs) {
  if(!cs) cs = changeset.create(null, true);
  cs.signals[this._name] = 1;
  this._graph.propagate(cs, this);
};

proto.on = function(handler) {
  var sg = this,
      node = new Node(this._graph);

  node.evaluate = function(input) {
    return (handler(sg.name(), sg.value()), input);
  };

  this._handlers.push({ handler: handler, node: node });
  return this.addListener(node);
};

proto.off = function(handler) {
  var sg = this, h = this._handlers;
  for(var i=h.length; --i>=0;) {
    if(!handler || h[i].handler === handler) {
      sg.removeListener(h.splice(i, 1)[0].node);
    }
  }
  return this;
};

module.exports = Signal;
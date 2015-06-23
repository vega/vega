var Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    Deps = require('vega-dataflow/src/Dependencies'),
    Parameter = require('./Parameter');

function Transform(graph) {
  if(graph) Node.prototype.init.call(this, graph);
  return this;
}

Transform.addParameters = function(proto, params) {
  proto._parameters = proto._parameters || {};
  for (var name in params) {
    var p = params[name],
        param = proto._parameters[name] = new Parameter(name, p.type, proto);

    if (p.type === 'custom') {
      if (p.set) param.set = p.set.bind(param);
      if (p.get) param.get = p.get.bind(param);
    }

    if (p.hasOwnProperty('default')) param.set(p.default);
  }
};

var proto = (Transform.prototype = new Node());

proto.param = function(name, value) {
  var param = this._parameters[name];
  return (param === undefined) ? this :
    (arguments.length === 1) ? param.get() : param.set(value);
};

proto.transform = function(input, reset) { return input; };
proto.evaluate = function(input) {
  // Many transforms store caches that must be invalidated if
  // a signal value has changed. 
  var reset = this._stamp < input.stamp && this.dependency(Deps.SIGNALS).some(function(s) { 
    return !!input.signals[s] 
  });

  return this.transform(input, reset);
};

proto.output = function(map) {
  for (var key in this._output) {
    if (map[key] !== undefined) {
      this._output[key] = map[key];
    }
  }
  return this;
};

module.exports = Transform;
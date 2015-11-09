var df = require('vega-dataflow'),
    Base = df.Node.prototype, // jshint ignore:line
    Deps = df.Dependencies,
    Parameter = require('./Parameter');

function Transform(graph) {
  if (graph) Base.init.call(this, graph);
}

Transform.addParameters = function(proto, params) {
  proto._parameters = proto._parameters || {};
  for (var name in params) {
    var p = params[name],
        param = new Parameter(name, p.type, proto);

    proto._parameters[name] = param;

    if (p.type === 'custom') {
      if (p.set) param.set = p.set.bind(param);
      if (p.get) param.get = p.get.bind(param);
    }

    if (p.hasOwnProperty('default')) param.set(p.default);
  }
};

var prototype = (Transform.prototype = Object.create(Base));
prototype.constructor = Transform;

prototype.param = function(name, value) {
  var param = this._parameters[name];
  return (param === undefined) ? this :
    (arguments.length === 1) ? param.get() : param.set(value);
};

// Perform transformation. Subclasses should override.
prototype.transform = function(input/*, reset */) {
  return input;
};

prototype.evaluate = function(input) {
  // Many transforms store caches that must be invalidated if
  // a signal value has changed.
  var reset = this._stamp < input.stamp &&
    this.dependency(Deps.SIGNALS).reduce(function(c, s) {
      return c += input.signals[s] ? 1 : 0;
    }, 0);
  return this.transform(input, reset);
};

prototype.output = function(map) {
  for (var key in this._output) {
    if (map[key] !== undefined) {
      this._output[key] = map[key];
    }
  }
  return this;
};

module.exports = Transform;

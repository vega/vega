define(function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      Parameter = require('./Parameter'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Transform(graph) {
    if(graph) this.init(graph);
    return this;
  }

  Transform.addParameters = function(proto, params) {
    var p;
    for (var name in params) {
      p = params[name];
      proto[name] = new Parameter(name, p.type);
      if(p.default) proto[name].set(p.default);
    }
  };

  var proto = (Transform.prototype = new Node());

  proto.transform = function(input, reset) { return input; };
  proto.evaluate = function(input) {
    // Many transforms store caches that must be invalidated if
    // a signal value has changed. 
    var reset = this.dependency(C.SIGNALS).some(function(s) { 
      return !!input.signals[s] 
    });

    return this.transform(input, reset);
  };

  // Mocking an output parameter.
  proto.output = {
    set: function(transform, map) {
      for (var key in transform._output) {
        if (map[key] !== undefined) {
          transform._output[key] = map[key];
        }
      }
      return transform;
    }
  };

  return Transform;
});
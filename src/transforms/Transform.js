define(function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      Parameter = require('./Parameter'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Transform(graph) {
    Node.prototype.call(this, graph);
  }

  Transform.addParameters = function(proto, params) {
    var p;
    for (var name in params) {
      p = params[name];
      proto[name] = new Parameter(name, p.type, p.default);
    }
  };

  var proto = (Transform.prototype = new Node());

  proto.reset = function(input) { return input; };
  proto.transform = function(input) { return input; };

  proto.evaluate = function(input) {
    // Many transforms store caches that must be invalidated if
    // a signal value has changed. 
    var reset = this.dependency(C.SIGNALS).some(function(s) { 
      return !!input.signals[s] 
    });

    if(reset) input = this.reset(input);

    return this.transform(input);
  };
  
  proto.output = function(map) {
    for (var key in this._output) {
      if (map[key] !== undefined) {
        this._output[key] = map[key];
      }
    }
    return this;
  };

  return Transform;
});
define(function(require, exports, module) {
  var Transform = require('./Transform'),
      Aggregate = require('./Aggregate'),
      tuple = require('../dataflow/tuple'),
      util = require('../util/index');

  function Unique(graph) {
    Aggregate.prototype.init.call(this, graph);
    Transform.addParameters(this, {
      on: {type: "field"},
      as: {type: "value"}
    });

    return this;
  }

  var proto = (Unique.prototype = new Aggregate());

  proto._new_tuple = function(x) {
    var o  = {},
        on = this.on.get(this._graph),
        as = this.as.get(this._graph);

    o[as] = on.accessor(x);
    return tuple.create(o, null);
  };

  proto.transform = function(input, reset) {
    util.debug(input, ["uniques"]);
    this._refs = [this.on.get(this._graph).accessor];
    return Aggregate.prototype.transform.call(this, input, reset);
  };

  return Unique;
});
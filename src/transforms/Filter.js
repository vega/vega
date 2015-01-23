define(function(require, exports, module) {
  var Transform = require('./Transform'),
      changeset = require('../dataflow/changeset'), 
      expr = require('../parse/expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Filter(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {test: {type: "expr"} });

    this._skip = {};
    return this;
  }

  var proto = (Filter.prototype = new Transform());

  proto._test = function(x) {
    return expr.eval(this._graph, this.test.get(this._graph), 
      x, null, null, null, this.dependency(C.SIGNALS));
  };

  proto.transform = function(input) {
    util.debug(input, ["filtering"]);
    var output = changeset.create(input),
        skip = this._skip,
        f = this;

    input.rem.forEach(function(x) {
      if (skip[x._id] !== 1) output.rem.push(x);
      else skip[x._id] = 0;
    });

    input.add.forEach(function(x) {
      if (f._test(x)) output.add.push(x);
      else skip[x._id] = 1;
    });

    input.mod.forEach(function(x) {
      var b = f._test(x),
          s = (skip[x._id] === 1);
      if (b && s) {
        skip[x._id] = 0;
        output.add.push(x);
      } else if (b && !s) {
        output.mod.push(x);
      } else if (!b && s) {
        // do nothing, keep skip true
      } else { // !b && !s
        output.rem.push(x);
        skip[x._id] = 1;
      }
    });

    return output;
  };

  return Filter;
});
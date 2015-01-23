define(function(require, exports, module) {
  var util = require('../util/index'),
      bins = require('../util/bins'),
      tuple = require('../dataflow/tuple');

  return function bin(model) {

    var field,
        accessor,
        setter,
        min = undefined,
        max = undefined,
        step = undefined,
        maxbins = 20,
        output = "bin";

    var node = new model.Node(function(input) {
      var b = bins({
        min: min,
        max: max,
        step: step,
        maxbins: maxbins
      });

      function update(d) {
        var v = accessor(d);
        v = v == null ? null
          : b.start + b.step * ~~((v - b.start) / b.step);
        tuple.set(d, output, v, input.stamp);
      }
      input.add.forEach(update);
      input.mod.forEach(update);
      input.rem.forEach(update);

      return input;
    });

    node.min = function(x) {
      return (min = x, node);
    };

    node.max = function(x) {
      return (max = x, node);
    };

    node.step = function(x) {
      return (step = x, node);
    };

    node.maxbins = function(x) {
      return (maxbins = x, node);
    };

    node.field = function(f) {
      field = f;
      accessor = util.accessor(f);
      return node;
    };

    node.output = function(f) {
      return (output = f, node);
    };

    return node;
  };

});
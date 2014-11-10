define(function(require, exports, module) {
  var util = require('../util/index'), 
      tuple = require('../core/tuple'), 
      changeset = require('../core/changeset');

  return function fold(model) {
    var fields = [], accessors = [],
      output = {key: "key", value: "value"},
      cache = {};
    
    function get_tuple(x, i) {
      var list = cache[x._id] || (cache[x._id] = Array(fields.length));
      return list[i] || (list[i] = tuple.create(x, x._prev));
    }

    function fn(data, out, stamp) {
      data.forEach(function(x) {
        for (var i=0; i<fields.length; ++i) {
          var o = get_tuple(x, i);
          tuple.set(o, output.key, fields[i], stamp);
          tuple.set(o, output.value, accessors[i](x), stamp);
          out.push(o);
        }
      });
    }
    
    var node = new model.Node(function(input) {
      util.debug(input, ["folding"]);

      var out = changeset.create(input);
      fn(input.add, out.add, input.stamp);
      fn(input.mod, out.mod, input.stamp);
      input.rem.forEach(function(x) {
        out.rem.push.apply(out.rem, cache[x._id]);
      });

      // If we're only propagating values, don't mark key/value as updated.
      if(input.add.length || input.rem.length || 
        fields.some(function(f) { return !!input.fields[f]; }))
          out.fields[output.key] = 1, out.fields[output.value] = 1;
      return out;
    });
    node._router = true;

    node.fields = function(f) {
      fields = util.array(f);
      accessors = fields.map(util.accessor);
      return node;
    };

    node.output = function(map) {
      util.keys(output).forEach(function(k) {
        if (map[k] !== undefined) {
          output[k] = map[k];
        }
      });
      return node;
    };

    return node;
  };
});
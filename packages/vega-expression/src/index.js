var parser = require('./parser'),
    codegen = require('./codegen');

var expr = module.exports = {
  parse: function(input, opt) {
      return parser.parse('('+input+')', opt);
    },
  code: function(opt) {
      return codegen(opt);
    },
  compiler: function(args, opt) {
      args = args.slice();
      var generator = codegen(opt),
          len = args.length,
          compile = function(str) {
            var value = generator(expr.parse(str));
            args[len] = '"use strict"; return (' + value.code + ');';
            var fn = Function.apply(null, args);
            value.fn = (args.length > 8) ?
              function() { return fn.apply(value, arguments); } :
              function(a, b, c, d, e, f, g) {
                return fn.call(value, a, b, c, d, e, f, g);
              }; // call often faster than apply, use if args low enough
            return value;
          };
      compile.codegen = generator;
      return compile;
    },
  functions: require('./functions'),
  constants: require('./constants')
};
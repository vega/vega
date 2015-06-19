var parser = require('./parser'),
    codegen = require('./codegen');
    
var expr = module.exports = {
  parse: function(input, opt) {
      return parser.parse('('+input+')', opt);
    },
  code: function(opt) {
      return codegen(opt);
    },
  compiler: function(args, fieldVar, globalVar) {
      args = args.slice();
      var codegen = codegen({
            idWhiteList: args,
            fieldVar: fieldVar,
            globalVar: globalVar
          }),
          len = args.length;
      return function(str) {    
        var value = codegen(expr.parse(str));
        args[len] = '"use strict"; return (' + value.code + ');';
        value.fn = Function.apply(null, args);
        return value;
      };
    }
};

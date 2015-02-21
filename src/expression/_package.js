vg.expression = {};

vg.expression.parse = function(input, opt) {
  return vg_expression_parser.parse("("+input+")", opt);
};

vg.expression.code = function(opt) {
  return vg_expression_codegen(opt);
};
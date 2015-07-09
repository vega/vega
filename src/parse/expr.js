var expr = require('vega-expression'),
    args = ['datum', 'event', 'signals'];

module.exports = expr.compiler(args, {
  idWhiteList: args,
  fieldVar:    args[0],
  globalVar:   args[2],
  functions:   function(codegen) {
    var fn = expr.functions(codegen);
    fn.item   = function() { return 'event.vg.item'; };
    fn.group  = 'event.vg.getGroup';
    fn.mouseX = 'event.vg.getX';
    fn.mouseY = 'event.vg.getY';
    fn.mouse  = 'event.vg.getXY';
    return fn;
  }
});

var expr = require('vega-expression'),
    args = ['datum', 'event', 'signals'];

module.exports = expr.compiler(args, {
  idWhiteList: args,
  fieldVar:    args[0],
  globalVar:   args[2],
  functions:   function(codegen) {
    var fn = expr.functions(codegen);
    fn.eventItem = function() { return 'event.vg.item'; };
    fn.eventGroup = 'event.vg.getGroup';
    fn.eventX = 'event.vg.getX';
    fn.eventY = 'event.vg.getY';
    fn.open = 'window.open';
    return fn;
  }
});

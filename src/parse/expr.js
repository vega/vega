var expr = require('vega-expression'),
    args = ['datum', 'event', 'signals'];

module.exports = expr.compiler(args, {
  idWhiteList:  args,
  fieldVar:     args[0],
  globalVar:    args[2],
  functions:    function(codegen) {
    var fn = expr.functions(codegen);
    fn.eventItem = function() { return 'event.vg.item'; };
    fn.eventGroup = 'event.vg.getGroup';
    fn.eventX = 'event.vg.getX';
    fn.eventY = 'event.vg.getY';
    fn.open = 'window.open';
    fn.inrange = 'this.defs.inrange';
    return fn;
  },
  functionDefs: function(codegen) {
    return {
      'inrange': inrange
    };
  }
});

function inrange(val, a, b, exclusive) {
  var min = a, max = b;
  if (a > b) { min = b; max = a; }
  return exclusive ?
    (min < val && max > val) :
    (min <= val && max >= val);
}

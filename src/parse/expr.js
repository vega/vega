var template = require('datalib').template,
    expr = require('vega-expression'),
    args = ['model', 'datum', 'event', 'signals'];

module.exports = expr.compiler(args, {
  idWhiteList: ['datum', 'event', 'signals'],
  fieldVar:    args[1],
  globalVar:   args[3],
  functions:   function(codegen) {
    var fn = expr.functions(codegen);
    fn.eventItem  = 'event.vg.item';
    fn.eventGroup = 'event.vg.getGroup';
    fn.eventX     = 'event.vg.getX';
    fn.eventY     = 'event.vg.getY';
    fn.open       = 'window.open';
    fn.scale      = scaleGen(codegen, false);
    fn.iscale     = scaleGen(codegen, true);
    fn.inrange    = 'this.defs.inrange';
    fn.format     = 'this.defs.number';
    fn.timeFormat = 'this.defs.time';
    fn.utcFormat  = 'this.defs.utc';
    return fn;
  },
  functionDefs: function(/*codegen*/) {
    return {
      'scale':   scale,
      'inrange': inrange,
      'number':  numberFormat,
      'time':    timeFormat,
      'utc':     utcFormat
    };
  }
});

function scaleGen(codegen, inverse) {
  return function(args) {
    args = args.map(codegen);
    var n = args.length;
    if (n < 2 || n > 3) {
      throw Error("scale takes exactly 2 or 3 arguments.");
    }
    return 'this.defs.scale(model, ' + inverse + ', ' +
      args[0] + ',' + args[1] + (n > 2 ? ',' + args[2] : '') + ')';
  };
}

function scale(model, invert, name, value, scope) {
  if (!scope || !scope.scale) {
    scope = (scope && scope.mark) ? scope.mark.group : model.scene().items[0];
  }
  // Verify scope is valid
  if (model.group(scope._id) !== scope) {
    throw Error('Scope for scale "'+name+'" is not a valid group item.');
  }
  var s = scope.scale(name);
  return !s ? value : (invert ? s.invert(value) : s(value));
}

function inrange(val, a, b, exclusive) {
  var min = a, max = b;
  if (a > b) { min = b; max = a; }
  return exclusive ?
    (min < val && max > val) :
    (min <= val && max >= val);
}

function numberFormat(specifier, v) {
  return template.format(specifier, 'number')(v);
}

function timeFormat(specifier, d) {
  return template.format(specifier, 'time')
    (typeof d==='number' ? new Date(d) : d);
}

function utcFormat(specifier, d) {
  return template.format(specifier, 'utc')
    (typeof d==='number' ? new Date(d) : d);
}

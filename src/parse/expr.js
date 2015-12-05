var expr = require('vega-expression'),
    args = ['model', 'datum', 'event', 'signals'];

module.exports = expr.compiler(args, {
  idWhiteList: ['datum', 'event', 'signals'],
  fieldVar:    args[1],
  globalVar:   args[3],
  functions:   function(codegen) {
    var fn = expr.functions(codegen);
    fn.eventItem = 'event.vg.item';
    fn.eventGroup = 'event.vg.getGroup';
    fn.eventX = 'event.vg.getX';
    fn.eventY = 'event.vg.getY';
    fn.open = 'window.open';
    fn.inrange = 'this.defs.inrange';
    fn.scale = scaleCodegen;
    fn.iscale = iscaleCodegen;

    return fn;

    function scaleCodegen(args) {
      args = args.map(codegen);
      if (args.length == 2) {
        return 'this.defs.scale(model, false, ' + args[0] + ',' + args[1] + ')';
      } else if (args.length == 3) {
        return 'this.defs.scale(model, false, ' + args[0] + ',' + args[1] + ',' + args[2] + ')';
      } else {
        throw new Error("scale takes exactly 2 or 3 arguments.");
      }
    }

    function iscaleCodegen(args) {
      args = args.map(codegen);
      if (args.length == 2) {
        return 'this.defs.scale(model, true, ' + args[0] + ',' + args[1] + ')';
      } else if (args.length == 3) {
        return 'this.defs.scale(model, true, ' + args[0] + ',' + args[1] + ',' + args[2] + ')';
      } else {
        throw new Error("iscale takes exactly 2 or 3 arguments.");
      }
    }
  },
  functionDefs: function(codegen) {
    return {
      'scale': scale,
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

function scale(model, invert, name, value, scope) {
  if (!scope || !scope.scale) {
    scope = (scope && scope.mark) ? scope.mark.group : model.scene().items[0];
  }

  // Verify scope is valid
  if (model.group(scope._id) !== scope) {
    throw new Error('Scope for scale "'+name+'" is not a valid group item.');
  }

  var s = scope.scale(name);
  return !s ? value : (invert ? s.invert(value) : s(value));
}

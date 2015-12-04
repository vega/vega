var expr = require('vega-expression'),
    args = ['model', 'datum', 'event', 'signals'];

module.exports = expr.compiler(args, {
  idWhiteList: args,
  fieldVar:    args[1],
  globalVar:   args[3],
  functions:   function(codegen) {
    var fn = expr.functions(codegen);
    fn.eventItem = function() { return 'event.vg.item'; };
    fn.eventGroup = 'event.vg.getGroup';
    fn.eventX = 'event.vg.getX';
    fn.eventY = 'event.vg.getY';
    fn.open = 'window.open';

    fn.scale = function(args) {
      args = args.map(codegen);
      if (args.length == 2) {
        return 'this.defs.scale(model, false, ' + args[0] + ',' + args[1] + ')';
      } else if (args.length == 3) {
        return 'this.defs.scale(model, false, ' + args[0] + ',' + args[1] + ',' + args[2] + ')';
      } else {
        throw new Error("scale takes exactly 2 or 3 arguments.");
      }
    };

    fn.iscale = function(args) {
      args = args.map(codegen);
      if (args.length == 2) {
        return 'this.defs.scale(model, true, ' + args[0] + ',' + args[1] + ')';
      } else if (args.length == 3) {
        return 'this.defs.scale(model, true, ' + args[0] + ',' + args[1] + ',' + args[2] + ')';
      } else {
        throw new Error("iscale takes exactly 2 or 3 arguments.");
      }
    };
    return fn;
  },
  functionDefs: function(codegen) {
    return {
     scale: function(model, invert, name, value, scope) {
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
    };
  }
});

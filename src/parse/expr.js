var dl = require('datalib'),
    template = dl.template,
    expr = require('vega-expression'),
    args = ['datum', 'event', 'signals'];

function wrap(model) {
  var compile = expr.compiler(args, {
    idWhiteList: args,
    fieldVar:    args[0],
    globalVar:   function(id) {
      return 'this.sig[' + dl.str(id) + ']._value';
    },
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
      fn.indata     = indataGen(codegen, model);
      fn.format     = 'this.defs.format';
      fn.timeFormat = 'this.defs.timeFormat';
      fn.utcFormat  = 'this.defs.utcFormat';
      return fn;
    },
    functionDefs: function(/*codegen*/) {
      return {
        'scale':      scale,
        'inrange':    inrange,
        'indata':     indata,
        'format':     numberFormat,
        'timeFormat': timeFormat,
        'utcFormat':  utcFormat
      };
    }
  });

  return function(str) {
    var x = compile(str);
    x.model = model;
    x.sig = model ? model._signals : {};
    return x;
  };
}

function scaleGen(codegen, invert) {
  return function(args) {
    args = args.map(codegen);
    var n = args.length;
    if (n < 2 || n > 3) {
      throw Error("scale takes exactly 2 or 3 arguments.");
    }
    return 'this.defs.scale(this.model, ' + invert + ', ' +
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

function indataGen(codegen, model) {
  return function(args) {
    var n = args.length,
        field, data;
    if (n < 2 || n > 3) {
      throw Error("indata takes exactly 2 or 3 arguments.");
    }
    if (args[0].type == 'Literal' && (!args[2] || args[2].type === 'Literal')) {
      // The call uses literals, so we can create the index on the
      // data source now.
      field = args[2] ? args[2].value : null;
      data = model.data(args[0].value);
      if (data) data.getIndex(field);
    }
    args = args.map(codegen);
    return 'this.defs.indata(this.model,' + args[0] + ',' + args[1] + (n > 2 ? ',' + args[2] : '') + ')'
  }
}

function indata(model, dataname, val, field) {
  var data = model.data(dataname);
  return data && data.hasElement(val, field);
}

function numberFormat(specifier, v) {
  return template.format(specifier, 'number')(v);
}

function timeFormat(specifier, d) {
  return template.format(specifier, 'time')(typeof d==='number' ? new Date(d) : d);
}

function utcFormat(specifier, d) {
  return template.format(specifier, 'utc')(typeof d==='number' ? new Date(d) : d);
}

wrap.codegen = compile.codegen;
wrap.scale = scale;
module.exports = wrap;

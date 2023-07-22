(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega = global.vega || {}));
})(this, (function (exports) { 'use strict';

  function adjustSpatial (item, encode, swap) {
    let t;
    if (encode.x2) {
      if (encode.x) {
        if (swap && item.x > item.x2) {
          t = item.x;
          item.x = item.x2;
          item.x2 = t;
        }
        item.width = item.x2 - item.x;
      } else {
        item.x = item.x2 - (item.width || 0);
      }
    }
    if (encode.xc) {
      item.x = item.xc - (item.width || 0) / 2;
    }
    if (encode.y2) {
      if (encode.y) {
        if (swap && item.y > item.y2) {
          t = item.y;
          item.y = item.y2;
          item.y2 = t;
        }
        item.height = item.y2 - item.y;
      } else {
        item.y = item.y2 - (item.height || 0);
      }
    }
    if (encode.yc) {
      item.y = item.yc - (item.height || 0) / 2;
    }
  }

  var Constants = {
    NaN: NaN,
    E: Math.E,
    LN2: Math.LN2,
    LN10: Math.LN10,
    LOG2E: Math.LOG2E,
    LOG10E: Math.LOG10E,
    PI: Math.PI,
    SQRT1_2: Math.SQRT1_2,
    SQRT2: Math.SQRT2,
    MIN_VALUE: Number.MIN_VALUE,
    MAX_VALUE: Number.MAX_VALUE
  };

  var Ops = {
    '*': (a, b) => a * b,
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '/': (a, b) => a / b,
    '%': (a, b) => a % b,
    '>': (a, b) => a > b,
    '<': (a, b) => a < b,
    '<=': (a, b) => a <= b,
    '>=': (a, b) => a >= b,
    '==': (a, b) => a == b,
    '!=': (a, b) => a != b,
    '===': (a, b) => a === b,
    '!==': (a, b) => a !== b,
    '&': (a, b) => a & b,
    '|': (a, b) => a | b,
    '^': (a, b) => a ^ b,
    '<<': (a, b) => a << b,
    '>>': (a, b) => a >> b,
    '>>>': (a, b) => a >>> b
  };

  var Unary = {
    '+': a => +a,
    '-': a => -a,
    '~': a => ~a,
    '!': a => !a
  };

  const slice = Array.prototype.slice;
  const apply = (m, args, cast) => {
    const obj = cast ? cast(args[0]) : args[0];
    return obj[m].apply(obj, slice.call(args, 1));
  };
  const datetime = (y, m, d, H, M, S, ms) => new Date(y, m || 0, d != null ? d : 1, H || 0, M || 0, S || 0, ms || 0);
  var Functions = {
    // math functions
    isNaN: Number.isNaN,
    isFinite: Number.isFinite,
    abs: Math.abs,
    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,
    atan2: Math.atan2,
    ceil: Math.ceil,
    cos: Math.cos,
    exp: Math.exp,
    floor: Math.floor,
    log: Math.log,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    random: Math.random,
    round: Math.round,
    sin: Math.sin,
    sqrt: Math.sqrt,
    tan: Math.tan,
    clamp: (a, b, c) => Math.max(b, Math.min(c, a)),
    // date functions
    now: Date.now,
    utc: Date.UTC,
    datetime: datetime,
    date: d => new Date(d).getDate(),
    day: d => new Date(d).getDay(),
    year: d => new Date(d).getFullYear(),
    month: d => new Date(d).getMonth(),
    hours: d => new Date(d).getHours(),
    minutes: d => new Date(d).getMinutes(),
    seconds: d => new Date(d).getSeconds(),
    milliseconds: d => new Date(d).getMilliseconds(),
    time: d => new Date(d).getTime(),
    timezoneoffset: d => new Date(d).getTimezoneOffset(),
    utcdate: d => new Date(d).getUTCDate(),
    utcday: d => new Date(d).getUTCDay(),
    utcyear: d => new Date(d).getUTCFullYear(),
    utcmonth: d => new Date(d).getUTCMonth(),
    utchours: d => new Date(d).getUTCHours(),
    utcminutes: d => new Date(d).getUTCMinutes(),
    utcseconds: d => new Date(d).getUTCSeconds(),
    utcmilliseconds: d => new Date(d).getUTCMilliseconds(),
    // sequence functions
    length: x => x.length,
    join: function () {
      return apply('join', arguments);
    },
    indexof: function () {
      return apply('indexOf', arguments);
    },
    lastindexof: function () {
      return apply('lastIndexOf', arguments);
    },
    slice: function () {
      return apply('slice', arguments);
    },
    reverse: x => x.slice().reverse(),
    // string functions
    parseFloat: parseFloat,
    parseInt: parseInt,
    upper: x => String(x).toUpperCase(),
    lower: x => String(x).toLowerCase(),
    substring: function () {
      return apply('substring', arguments, String);
    },
    split: function () {
      return apply('split', arguments, String);
    },
    replace: function () {
      return apply('replace', arguments, String);
    },
    trim: x => String(x).trim(),
    // regexp functions
    regexp: RegExp,
    test: (r, t) => RegExp(r).test(t)
  };

  const EventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'];
  const DisallowedMethods = new Set([Function, eval, setTimeout, setInterval]);
  if (typeof setImmediate === 'function') DisallowedMethods.add(setImmediate);
  const Visitors = {
    Literal: ($, n) => n.value,
    Identifier: ($, n) => {
      const id = n.name;
      return $.memberDepth > 0 ? id : id === 'datum' ? $.datum : id === 'event' ? $.event : id === 'item' ? $.item : Constants[id] || $.params['$' + id];
    },
    MemberExpression: ($, n) => {
      const d = !n.computed,
        o = $(n.object);
      if (d) $.memberDepth += 1;
      const p = $(n.property);
      if (d) $.memberDepth -= 1;
      if (DisallowedMethods.has(o[p])) {
        // eslint-disable-next-line no-console
        console.error(`Prevented interpretation of member "${p}" which could lead to insecure code execution`);
        return;
      }
      return o[p];
    },
    CallExpression: ($, n) => {
      const args = n.arguments;
      let name = n.callee.name;

      // handle special internal functions used by encoders
      // re-route to corresponding standard function
      if (name.startsWith('_')) {
        name = name.slice(1);
      }

      // special case "if" due to conditional evaluation of branches
      return name === 'if' ? $(args[0]) ? $(args[1]) : $(args[2]) : ($.fn[name] || Functions[name]).apply($.fn, args.map($));
    },
    ArrayExpression: ($, n) => n.elements.map($),
    BinaryExpression: ($, n) => Ops[n.operator]($(n.left), $(n.right)),
    UnaryExpression: ($, n) => Unary[n.operator]($(n.argument)),
    ConditionalExpression: ($, n) => $(n.test) ? $(n.consequent) : $(n.alternate),
    LogicalExpression: ($, n) => n.operator === '&&' ? $(n.left) && $(n.right) : $(n.left) || $(n.right),
    ObjectExpression: ($, n) => n.properties.reduce((o, p) => {
      $.memberDepth += 1;
      const k = $(p.key);
      $.memberDepth -= 1;
      if (DisallowedMethods.has($(p.value))) {
        // eslint-disable-next-line no-console
        console.error(`Prevented interpretation of property "${k}" which could lead to insecure code execution`);
      } else {
        o[k] = $(p.value);
      }
      return o;
    }, {})
  };
  function interpret (ast, fn, params, datum, event, item) {
    const $ = n => Visitors[n.type]($, n);
    $.memberDepth = 0;
    $.fn = Object.create(fn);
    $.params = params;
    $.datum = datum;
    $.event = event;
    $.item = item;

    // route event functions to annotated vega event context
    EventFunctions.forEach(f => $.fn[f] = (...args) => event.vega[f](...args));
    return $(ast);
  }

  var expression = {
    /**
     * Parse an expression used to update an operator value.
     */
    operator(ctx, expr) {
      const ast = expr.ast,
        fn = ctx.functions;
      return _ => interpret(ast, fn, _);
    },
    /**
     * Parse an expression provided as an operator parameter value.
     */
    parameter(ctx, expr) {
      const ast = expr.ast,
        fn = ctx.functions;
      return (datum, _) => interpret(ast, fn, _, datum);
    },
    /**
     * Parse an expression applied to an event stream.
     */
    event(ctx, expr) {
      const ast = expr.ast,
        fn = ctx.functions;
      return event => interpret(ast, fn, undefined, undefined, event);
    },
    /**
     * Parse an expression used to handle an event-driven operator update.
     */
    handler(ctx, expr) {
      const ast = expr.ast,
        fn = ctx.functions;
      return (_, event) => {
        const datum = event.item && event.item.datum;
        return interpret(ast, fn, _, datum, event);
      };
    },
    /**
     * Parse an expression that performs visual encoding.
     */
    encode(ctx, encode) {
      const {
          marktype,
          channels
        } = encode,
        fn = ctx.functions,
        swap = marktype === 'group' || marktype === 'image' || marktype === 'rect';
      return (item, _) => {
        const datum = item.datum;
        let m = 0,
          v;
        for (const name in channels) {
          v = interpret(channels[name].ast, fn, _, datum, undefined, item);
          if (item[name] !== v) {
            item[name] = v;
            m = 1;
          }
        }
        if (marktype !== 'rule') {
          adjustSpatial(item, channels, swap);
        }
        return m;
      };
    }
  };

  exports.expressionInterpreter = expression;

}));

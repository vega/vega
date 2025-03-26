import { ascending, isString } from 'vega-util';

const slice = Array.prototype.slice;

const apply = (m, args, cast) => {
  const obj = cast ? cast(args[0]) : args[0];
  return obj[m].apply(obj, slice.call(args, 1));
};

const datetime = (yearOrTimestring, m = 0, d = 1, H = 0, M = 0, S = 0, ms = 0) =>
   isString(yearOrTimestring)
     ? new Date(yearOrTimestring)
     : new Date(yearOrTimestring, m, d, H, M, S, ms);

export default {
  // math functions
  isNaN:     Number.isNaN,
  isFinite:  Number.isFinite,
  abs:       Math.abs,
  acos:      Math.acos,
  asin:      Math.asin,
  atan:      Math.atan,
  atan2:     Math.atan2,
  ceil:      Math.ceil,
  cos:       Math.cos,
  exp:       Math.exp,
  floor:     Math.floor,
  log:       Math.log,
  max:       Math.max,
  min:       Math.min,
  pow:       Math.pow,
  random:    Math.random,
  round:     Math.round,
  sin:       Math.sin,
  sqrt:      Math.sqrt,
  tan:       Math.tan,
  clamp:     (a, b, c) => Math.max(b, Math.min(c, a)),

  // date functions
  now:              Date.now,
  utc:              Date.UTC,
  datetime:         datetime,
  date:             d => new Date(d).getDate(),
  day:              d => new Date(d).getDay(),
  year:             d => new Date(d).getFullYear(),
  month:            d => new Date(d).getMonth(),
  hours:            d => new Date(d).getHours(),
  minutes:          d => new Date(d).getMinutes(),
  seconds:          d => new Date(d).getSeconds(),
  milliseconds:     d => new Date(d).getMilliseconds(),
  time:             d => new Date(d).getTime(),
  timezoneoffset:   d => new Date(d).getTimezoneOffset(),
  utcdate:          d => new Date(d).getUTCDate(),
  utcday:           d => new Date(d).getUTCDay(),
  utcyear:          d => new Date(d).getUTCFullYear(),
  utcmonth:         d => new Date(d).getUTCMonth(),
  utchours:         d => new Date(d).getUTCHours(),
  utcminutes:       d => new Date(d).getUTCMinutes(),
  utcseconds:       d => new Date(d).getUTCSeconds(),
  utcmilliseconds:  d => new Date(d).getUTCMilliseconds(),

  // sequence functions
  length:       x => x.length,
  join:         function() { return apply('join', arguments); },
  indexof:      function() { return apply('indexOf', arguments); },
  lastindexof:  function() { return apply('lastIndexOf', arguments); },
  slice:        function() { return apply('slice', arguments); },
  reverse:      x => x.slice().reverse(),
  sort:         x => x.slice().sort(ascending),

  // string functions
  parseFloat:   parseFloat,
  parseInt:     parseInt,
  upper:        x => String(x).toUpperCase(),
  lower:        x => String(x).toLowerCase(),
  substring:    function() { return apply('substring', arguments, String); },
  split:        function() { return apply('split', arguments, String); },
  replace:      function() { return apply('replace', arguments, String); },
  trim:         x => String(x).trim(),
  // Base64 encode/decode
  // Convert binary string to base64-encoded ascii
  btoa:         x => btoa(x),
  // Convert base64-encoded ascii to binary string
  atob:         x => atob(x),

  // regexp functions
  regexp:       RegExp,
  test:         (r, t) => RegExp(r).test(t)
};

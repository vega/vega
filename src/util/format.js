var dl = require('datalib');

var TIME    = 'time',
    UTC     = 'utc',
    STRING  = 'string',
    ORDINAL = 'ordinal',
    NUMBER  = 'number';

function getTickFormat(scale, tickCount, tickFormatType, tickFormatString) {
  var formatType = tickFormatType || inferFormatType(scale);
  return getFormatter(scale, tickCount, formatType, tickFormatString);
}

function inferFormatType(scale) {
  switch (scale.type) {
    case TIME:    return TIME;
    case UTC:     return UTC;
    case ORDINAL: return STRING;
    default:      return NUMBER;
  }
}

// Adapted from d3 log scale
// TODO customize? replace with range-size-aware filtering?
function logFilter(scale, domain, count, f) {
  if (count == null) return f;
  var base = scale.base(),
      k = Math.min(base, scale.ticks().length / count),
      v = domain[0] > 0 ? (e = 1e-12, Math.ceil) : (e = -1e-12, Math.floor),
      e;
  function log(x) {
    return (domain[0] < 0 ?
      -Math.log(x > 0 ? 0 : -x) :
      Math.log(x < 0 ? 0 : x)) / Math.log(base);
  }
  function pow(x) {
    return domain[0] < 0 ? -Math.pow(base, -x) : Math.pow(base, x);
  }
  return function(d) {
    return pow(v(log(d) + e)) / d >= k ? f(d) : '';
  };
}

function getFormatter(scale, tickCount, formatType, str) {
  var fmt = dl.format,
      log = scale.type === 'log',
      domain;

  switch (formatType) {
    case NUMBER:
      domain = scale.domain();
      return log ?
        logFilter(scale, domain, tickCount, fmt.auto.number(str || null)) :
        fmt.auto.linear(domain, tickCount, str || null);
    case TIME: return (str ? fmt : fmt.auto).time(str);
    case UTC:  return (str ? fmt : fmt.auto).utc(str);
    default:   return String;
  }
}

module.exports = {
  getTickFormat: getTickFormat
};
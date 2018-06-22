import {tickCount} from './ticks';
import {Transform} from 'vega-dataflow';
import {
  error, inherits, isFunction, peek, stringValue,
  toSet, zoomLinear, zoomLog, zoomPow
} from 'vega-util';

import {
  Ordinal, Band, Point,
  Linear, Log, Pow, Sqrt, Sequential,
  Quantile, Quantize, Threshold, BinOrdinal,
  Time, Utc
} from './scale-types';

import {
  bandSpace,
  interpolateRange,
  interpolate as getInterpolate,
  scale as getScale,
  scheme as getScheme,
  scaleImplicit
} from 'vega-scale';

import {
  interpolate,
  interpolateRgbBasis,
  interpolateRound
} from 'd3-interpolate';

var DEFAULT_COUNT = 5;

var INCLUDE_ZERO = toSet([Linear, Pow, Sqrt]);

var INCLUDE_PAD = toSet([Linear, Log, Pow, Sqrt, Time, Utc]);

var SKIP = toSet([
  'set', 'modified', 'clear', 'type', 'scheme', 'schemeExtent', 'schemeCount',
  'domain', 'domainMin', 'domainMid', 'domainMax', 'domainRaw', 'domainImplicit', 'nice', 'zero',
  'range', 'rangeStep', 'round', 'reverse', 'interpolate', 'interpolateGamma'
]);

/**
 * Maintains a scale function mapping data values to visual channels.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
export default function Scale(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype = inherits(Scale, Transform);

prototype.transform = function(_, pulse) {
  var df = pulse.dataflow,
      scale = this.value,
      prop;

  if (!scale || _.modified('type')) {
    this.value = scale = getScale((_.type || Linear).toLowerCase())();
  }

  for (prop in _) if (!SKIP[prop]) {
    // padding is a scale property for band/point but not others
    if (prop === 'padding' && INCLUDE_PAD[scale.type]) continue;
    // invoke scale property setter, raise warning if not found
    isFunction(scale[prop])
      ? scale[prop](_[prop])
      : df.warn('Unsupported scale property: ' + prop);
  }

  configureRange(scale, _, configureDomain(scale, _, df));

  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};

function configureDomain(scale, _, df) {
  // check raw domain, if provided use that and exit early
  var raw = rawDomain(scale, _.domainRaw, df);
  if (raw > -1) return raw;

  var domain = _.domain,
      type = scale.type,
      zero = _.zero || (_.zero === undefined && INCLUDE_ZERO[type]),
      n, mid;

  if (!domain) return 0;

  // adjust continuous domain for minimum pixel padding
  if (INCLUDE_PAD[type] && _.padding && domain[0] !== peek(domain)) {
    domain = padDomain(type, domain, _.range, _.padding, _.exponent);
  }

  // adjust domain based on zero, min, max settings
  if (zero || _.domainMin != null || _.domainMax != null || _.domainMid != null) {
    n = ((domain = domain.slice()).length - 1) || 1;
    if (zero) {
      if (domain[0] > 0) domain[0] = 0;
      if (domain[n] < 0) domain[n] = 0;
    }
    if (_.domainMin != null) domain[0] = _.domainMin;
    if (_.domainMax != null) domain[n] = _.domainMax;

    if (_.domainMid != null) {
      mid = _.domainMid;
      if (mid < domain[0] || mid > domain[n]) {
        df.warn('Scale domainMid exceeds domain min or max.', mid);
      }
      domain.splice(n, 0, mid);
    }
  }

  // set the scale domain
  scale.domain(domainCheck(type, domain, df));

  // if ordinal scale domain is defined, prevent implicit
  // domain construction as side-effect of scale lookup
  if (type === Ordinal) {
    scale.unknown(_.domainImplicit ? scaleImplicit : undefined);
  }

  // perform 'nice' adjustment as requested
  if (_.nice && scale.nice) {
    scale.nice((_.nice !== true && tickCount(scale, _.nice)) || null);
  }

  // return the cardinality of the domain
  return domain.length;
}

function rawDomain(scale, raw, df) {
  if (raw) {
    scale.domain(domainCheck(scale.type, raw, df));
    return raw.length;
  } else {
    return -1;
  }
}

function padDomain(type, domain, range, pad, exponent) {
  var span = Math.abs(peek(range) - range[0]),
      frac = span / (span - 2 * pad),
      d = type === Log  ? zoomLog(domain, null, frac)
        : type === Sqrt ? zoomPow(domain, null, frac, 0.5)
        : type === Pow  ? zoomPow(domain, null, frac, exponent)
        : zoomLinear(domain, null, frac);

  domain = domain.slice();
  domain[0] = d[0];
  domain[domain.length-1] = d[1];
  return domain;
}

function domainCheck(type, domain, df) {
  if (type === Log) {
    // sum signs of domain values
    // if all pos or all neg, abs(sum) === domain.length
    var s = Math.abs(domain.reduce(function(s, v) {
      return s + (v < 0 ? -1 : v > 0 ? 1 : 0);
    }, 0));

    if (s !== domain.length) {
      df.warn('Log scale domain includes zero: ' + stringValue(domain));
    }
  }
  return domain;
}

function configureRange(scale, _, count) {
  var round = _.round || false,
      range = _.range;

  // if range step specified, calculate full range extent
  if (_.rangeStep != null) {
    range = configureRangeStep(scale.type, _, count);
  }

  // else if a range scheme is defined, use that
  else if (_.scheme) {
    range = configureScheme(scale.type, _, count);
    if (isFunction(range)) return scale.interpolator(range);
  }

  // given a range array for a sequential scale, convert to interpolator
  else if (range && scale.type === Sequential) {
    return scale.interpolator(interpolateRgbBasis(flip(range, _.reverse)));
  }

  // configure rounding / interpolation
  if (range && _.interpolate && scale.interpolate) {
    scale.interpolate(getInterpolate(_.interpolate, _.interpolateGamma));
  } else if (isFunction(scale.round)) {
    scale.round(round);
  } else if (isFunction(scale.rangeRound)) {
    scale.interpolate(round ? interpolateRound : interpolate);
  }

  if (range) scale.range(flip(range, _.reverse));
}

function configureRangeStep(type, _, count) {
  if (type !== Band && type !== Point) {
    error('Only band and point scales support rangeStep.');
  }

  // calculate full range based on requested step size and padding
  var outer = (_.paddingOuter != null ? _.paddingOuter : _.padding) || 0,
      inner = type === Point ? 1
            : ((_.paddingInner != null ? _.paddingInner : _.padding) || 0);
  return [0, _.rangeStep * bandSpace(count, inner, outer)];
}

function configureScheme(type, _, count) {
  var name = _.scheme.toLowerCase(),
      scheme = getScheme(name),
      extent = _.schemeExtent,
      discrete;

  if (!scheme) {
    error('Unrecognized scheme name: ' + _.scheme);
  }

  // determine size for potential discrete range
  count = (type === Threshold) ? count + 1
    : (type === BinOrdinal) ? count - 1
    : (type === Quantile || type === Quantize) ? (+_.schemeCount || DEFAULT_COUNT)
    : count;

  // adjust and/or quantize scheme as appropriate
  return type === Sequential ? adjustScheme(scheme, extent, _.reverse)
    : !extent && (discrete = getScheme(name + '-' + count)) ? discrete
    : isFunction(scheme) ? quantize(adjustScheme(scheme, extent), count)
    : type === Ordinal ? scheme : scheme.slice(0, count);
}

function adjustScheme(scheme, extent, reverse) {
  return (isFunction(scheme) && (extent || reverse))
    ? interpolateRange(scheme, flip(extent || [0, 1], reverse))
    : scheme;
}

function flip(array, reverse) {
  return reverse ? array.slice().reverse() : array;
}

function quantize(interpolator, count) {
  var samples = new Array(count),
      n = count + 1;
  for (var i = 0; i < count;) samples[i] = interpolator(++i / n);
  return samples;
}

import {Transform} from 'vega-dataflow';
import {scale as getScale, bandSpace} from 'vega-scale';
import {error, inherits, isFunction, toSet} from 'vega-util';
import {interpolate, interpolateRound} from 'd3-interpolate';

var SKIP = {
  'set': 1,
  'modified': 1,
  'clear': 1,

  'type': 1,
  'scheme': 1,

  'domain': 1,
  'domainMin': 1,
  'domainMax': 1,
  'domainRaw': 1,
  'nice': 1,
  'zero': 1,

  'range': 1,
  'rangeStep': 1,
  'round': 1,
  'reverse': 1
};

var BAND = 'band',
    POINT = 'point';

var INCLUDE_ZERO = toSet(['linear', 'pow', 'sqrt']);

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
  var scale = this.value, prop,
      create = !scale
            || _.modified('type')
            || _.modified('scheme')
            || _.scheme && _.modified('reverse');

  if (create) {
    this.value = (scale = createScale(_.type, _.scheme, _.reverse));
  }

  for (prop in _) if (!SKIP[prop]) {
    isFunction(scale[prop])
      ? scale[prop](_[prop])
      : pulse.dataflow.warn('Unsupported scale property: ' + prop);
  }

  configureRange(scale, _, configureDomain(scale, _));

  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};

function createScale(type, scheme, reverse) {
  var scale = getScale((type || 'linear').toLowerCase());
  return scale(scheme && scheme.toLowerCase(), reverse);
}

function configureDomain(scale, _) {
  var raw = rawDomain(scale, _.domainRaw);
  if (raw > -1) return raw;

  var domain = _.domain,
      zero = _.zero || (_.zero === undefined && INCLUDE_ZERO[scale.type]),
      n;

  if (!domain) return 0;

  if (zero || _.domainMin != null || _.domainMax != null) {
    n = (domain = domain.slice()).length - 1;
    if (zero) {
      if (domain[0] > 0) domain[0] = 0;
      if (domain[n] < 0) domain[n] = 0;
    }
    if (_.domainMin != null) domain[0] = _.domainMin;
    if (_.domainMax != null) domain[n] = _.domainMax;
  }

  scale.domain(domain);
  if (_.nice && scale.nice) scale.nice((_.nice !== true && +_.nice) || null);
  return domain.length;
}

function rawDomain(scale, raw) {
  return raw ? (scale.domain(raw), raw.length) : -1;
}

function configureRange(scale, _, count) {
  var type = scale.type,
      round = _.round || false,
      range = _.range;

  // configure rounding
  if (isFunction(scale.round)) {
    scale.round(round);
  } else if (isFunction(scale.rangeRound)) {
    scale.interpolate(round ? interpolateRound : interpolate);
  }

  // if range step specified, calculate full range extent
  if (_.rangeStep != null) {
    if (type !== BAND && type !== POINT) {
      error('Only band and point scales support rangeStep.');
    }

    // calculate full range based on requested step size and padding
    var outer = (_.paddingOuter != null ? _.paddingOuter : _.padding) || 0,
        inner = type === POINT ? 1
              : ((_.paddingInner != null ? _.paddingInner : _.padding) || 0);
    range = [0, _.rangeStep * bandSpace(count, inner, outer)];
  }

  if (range) {
    if (_.reverse) range = range.slice().reverse();
    scale.range(range);
  }
}

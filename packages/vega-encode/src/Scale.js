import {Transform} from 'vega-dataflow';
import {scale as getScale} from 'vega-scale';
import {error, inherits, isFunction, toSet} from 'vega-util';

var SKIP = {
  'set': 1,
  'modified': 1,
  'clear': 1,

  'type': 1,
  'scheme': 1,

  'domain': 1,
  'domainMin': 1,
  'domainMax': 1,
  'nice': 1,
  'zero': 1,

  'range': 1,
  'rangeStep': 1,
  'round': 1,
  'reverse': 1
};

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

function configureRange(scale, _, count) {
  var type = scale.type,
      range = _.range;

  if (_.rangeStep != null) {
    if (type !== 'band' && type !== 'point') {
      error('Only band and point scales support rangeStep.');
    }
    // calculate full range based on requested step size and padding
    // Mirrors https://github.com/d3/d3-scale/blob/master/src/band.js#L23
    var inner = (_.paddingInner != null ? _.paddingInner : _.padding) || 0,
        outer = (_.paddingOuter != null ? _.paddingOuter : _.padding) || 0;
    range = [0, _.rangeStep * (count - (count > 1 ? inner : 0) + outer * 2)];
  }

  if (range) {
    if (_.reverse) range = range.slice().reverse();
    scale[_.round ? 'rangeRound' : 'range'](range);
  }
}

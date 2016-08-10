import {Transform} from 'vega-dataflow';
import {scale as getScale, scheme as getScheme} from 'vega-scale';
import {error, inherits, isFunction} from 'vega-util';

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
  'round': 1,
  'bandSize': 1
};

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
  var scale = this.value, prop;

  if (!scale || _.modified('type') || _.modified('scheme')) {
    this.value = (scale = createScale(_.type, _.scheme, pulse));
  }

  for (prop in _) if (!SKIP[prop]) {
    isFunction(scale[prop])
      ? scale[prop](_[prop])
      : pulse.dataflow.warn('Unsupported scale property: ' + prop);
  }

  configureRange(scale, _, configureDomain(scale, _));
};

function createScale(scaleType, scheme) {
  var type = (scaleType || 'linear').toLowerCase(),
      scale;

  if (!type || !(scale = getScale(type))) {
    error('Unrecognized scale type: ' + scaleType);
  }

  if (scheme && !(scheme = getScheme(scheme))) {
    error('Unrecognized scale scheme: ' + scheme)
  }

  return scale = scale(scheme), scale.type = type, scale;
}

function configureDomain(scale, _) {
  var domain = _.domain;
  if (!domain) return 0;

  if (_.zero || _.domainMin != null || _.domainMax != null) {
    var n = (domain = domain.slice()).length - 1;
    if (_.zero) {
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

  if (_.bandSize != null) {
    if (type !== 'band' && type !== 'point') {
      error('Only band and point scales support bandSize.');
    }
    range = [0, _.bandSize * count];
  }

  if (range) scale[_.round ? 'rangeRound' : 'range'](range);
}

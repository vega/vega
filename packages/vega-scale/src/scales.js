import {default as scaleBand, point as scalePoint} from './band';
import scaleIndex from './index';
import invertRange from './invertRange';
import invertRangeExtent from './invertRangeExtent';
import getScheme from './schemes';
import {error} from 'vega-util';
import * as $ from 'd3-scale';

/**
 * Augment scales with their type and needed inverse methods.
 */
function create(type, constructor) {
  return function scale(scheme) {
    if (scheme && !(scheme = getScheme(scheme))) {
      error('Unrecognized scale scheme: ' + scheme)
    }

    var s = constructor(scheme);

    s.type = type;

    if (!s.invertRange) {
      s.invertRange = s.invert ? invertRange(s)
        : s.invertExtent ? invertRangeExtent(s)
        : undefined;
    }

    return s;
  };
}

export default function scale(type, scale) {
  return arguments.length > 1 ? (scales[type] = create(type, scale), this)
    : scales.hasOwnProperty(type) ? scales[type] : null;
}

var scales = {
  // base scale types
  identity:    $.scaleIdentity,
  linear:      $.scaleLinear,
  log:         $.scaleLog,
  ordinal:     $.scaleOrdinal,
  pow:         $.scalePow,
  sqrt:        $.scaleSqrt,
  quantile:    $.scaleQuantile,
  quantize:    $.scaleQuantize,
  threshold:   $.scaleThreshold,
  time:        $.scaleTime,
  utc:         $.scaleUtc,
  sequential:  $.scaleSequential,

  // extended scale types
  band:        scaleBand,
  point:       scalePoint,
  index:       scaleIndex
};

for (var key in scales) {
  scale(key, scales[key]);
}

import invertRange from './invertRange';
import invertRangeExtent from './invertRangeExtent';
import {
  band as scaleBand,
  point as scalePoint
} from './scaleBand';
import {
  binLinear as scaleBinLinear,
  binOrdinal as scaleBinOrdinal
} from './scaleBin';
import scaleSequential from './scaleSequential';

import * as $ from 'd3-scale';

/**
 * Augment scales with their type and needed inverse methods.
 */
function create(type, constructor) {
  return function scale() {
    var s = constructor();

    if (!s.invertRange) {
      s.invertRange = s.invert ? invertRange(s)
        : s.invertExtent ? invertRangeExtent(s)
        : undefined;
    }

    s.type = type;
    return s;
  };
}

export default function scale(type, scale) {
  if (arguments.length > 1) {
    scales[type] = create(type, scale);
    return this;
  } else {
    return scales.hasOwnProperty(type) ? scales[type] : undefined;
  }
}

var scales = {
  // base scale types
  identity:      $.scaleIdentity,
  linear:        $.scaleLinear,
  log:           $.scaleLog,
  ordinal:       $.scaleOrdinal,
  pow:           $.scalePow,
  sqrt:          $.scaleSqrt,
  quantile:      $.scaleQuantile,
  quantize:      $.scaleQuantize,
  threshold:     $.scaleThreshold,
  time:          $.scaleTime,
  utc:           $.scaleUtc,

  // extended scale types
  band:          scaleBand,
  point:         scalePoint,
  sequential:    scaleSequential,
  'bin-linear':  scaleBinLinear,
  'bin-ordinal': scaleBinOrdinal
};

for (var key in scales) {
  scale(key, scales[key]);
}

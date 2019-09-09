import {hasOwnProperty} from 'vega-util';
import invertRange from './scales/invertRange';
import invertRangeExtent from './scales/invertRangeExtent';

import {
  Identity,
  Linear, Log, Pow, Sqrt, Symlog,
  Time, UTC, Sequential, Diverging,
  Quantile, Quantize, Threshold,
  BinOrdinal, Ordinal, Band, Point
} from './scales/types';

import {
  band as scaleBand,
  point as scalePoint
} from './scales/scaleBand';

import {
  scaleBinOrdinal
} from './scales/scaleBinOrdinal';

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
    return hasOwnProperty(scales, type) ? scales[type] : undefined;
  }
}

var scales = {
  // identity scale
  [Identity]:      $.scaleIdentity,

  // continuous scales
  [Linear]:        $.scaleLinear,
  [Log]:           $.scaleLog,
  [Pow]:           $.scalePow,
  [Sqrt]:          $.scaleSqrt,
  [Symlog]:        $.scaleSymlog,
  [Time]:          $.scaleTime,
  [UTC]:           $.scaleUtc,

  // sequential scales
  [Sequential]:             $.scaleSequential, // backwards compat
  [Sequential+'-'+Linear]:  $.scaleSequential,
  [Sequential+'-'+Log]:     $.scaleSequentialLog,
  [Sequential+'-'+Pow]:     $.scaleSequentialPow,
  [Sequential+'-'+Sqrt]:    $.scaleSequentialSqrt,
  [Sequential+'-'+Symlog]:  $.scaleSequentialSymlog,

  // diverging scales
  [Diverging+'-'+Linear]:   $.scaleDiverging,
  [Diverging+'-'+Log]:      $.scaleDivergingLog,
  [Diverging+'-'+Pow]:      $.scaleDivergingPow,
  [Diverging+'-'+Sqrt]:     $.scaleDivergingSqrt,
  [Diverging+'-'+Symlog]:   $.scaleDivergingSymlog,

  // discretizing scales
  [Quantile]:      $.scaleQuantile,
  [Quantize]:      $.scaleQuantize,
  [Threshold]:     $.scaleThreshold,

  // discrete scales
  [BinOrdinal]:    scaleBinOrdinal,
  [Ordinal]:       $.scaleOrdinal,
  [Band]:          scaleBand,
  [Point]:         scalePoint
};

for (var key in scales) {
  scale(key, scales[key]);
}

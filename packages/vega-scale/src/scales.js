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

var temporalScales = [Time, UTC];
var binnedScales = [BinOrdinal];
var quantileScales = [Quantile];
var sequentialScales = [];
var divergingScales = [];
var interpolatingScales = [];
var logarithmicScales = [Log];
var continuousScales = [Linear, Log, Pow, Sqrt, Symlog, Time, UTC, Sequential];
var discreteScales = [BinOrdinal, Ordinal, Band, Point];
var discretizingScales = [BinOrdinal, Quantile, Quantize, Threshold];

export function isValidScaleType(type) {
  return hasOwnProperty(scales, type)
}

export function isTemporal(key) {
  return temporalScales.includes(key);
}

export function isBinned(key) {
  return binnedScales.includes(key);
}

export function isQuantile(key) {
  return quantileScales.includes(key);
}

export function isSequential(key) {
  return (key && key.startsWith(Sequential))
    || sequentialScales.includes(key);
}

export function isDiverging(key) {
  return (key && key.startsWith(Diverging))
    || divergingScales.includes(key);
}

export function isInterpolating(key) {
  return isSequential(key)
    || isDiverging(key)
    || interpolatingScales.includes(key);
}

export function isLogarithmic(key) {
  return (key && key.endsWith('-log'))
    || logarithmicScales.includes(key);
}

export function isContinuous(key) {
  return continuousScales.includes(key);
}

export function isDiscrete(key) {
  return discreteScales.includes(key);
}

export function isDiscretizing(key) {
  return discretizingScales.includes(key);
}

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

export default function scale(type, scale, options) {
  if (arguments.length > 1) {
    scales[type] = create(type, scale);

    options = options || {}
    if (options.temporal) {
      temporalScales.push(type);
    }
    if (options.binned) {
      binnedScales.push(type);
    }
    if (options.quantile) {
      quantileScales.push(type);
    }
    if (options.sequential) {
      sequentialScales.push(type);
    }
    if (options.diverging) {
      divergingScales.push(type);
    }
    if (options.interpolating) {
      interpolatingScales.push(type);
    }
    if (options.logarithmic) {
      logarithmicScales.push(type);
    }
    if (options.continuous) {
      continuousScales.push(type);
    }
    if (options.discrete) {
      discreteScales.push(type);
    }
    if (options.discretizing) {
      discretizingScales.push(type);
    }

    return this;
  } else {
    return isValidScaleType(type) ? scales[type] : undefined;
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

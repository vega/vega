import { array, toSet } from 'vega-util';
import invertRange from './scales/invertRange.js';
import invertRangeExtent from './scales/invertRangeExtent.js';

import {
  Band,
  BinOrdinal, Continuous as C, Discrete as D, Diverging, Interpolating as I,
  Identity, Linear, Log, Ordinal,
  Point, Pow, Quantile,
  Quantize, Sequential, Sqrt, Symlog,
  Temporal as T,
  Threshold,
  Time,
  UTC,
  Discretizing as Z
} from './scales/types.js';

import {
  band as scaleBand,
  point as scalePoint
} from './scales/scaleBand.js';

import {
  scaleBinOrdinal
} from './scales/scaleBinOrdinal.js';

import * as $ from 'd3-scale';

/** Private scale registry: should not be exported */
const scales = new Map();

const VEGA_SCALE = Symbol('vega_scale');

export function registerScale(scale) {
  scale[VEGA_SCALE] = true;
  return scale;
}

/**
 * Return true if object was created by a constructor from the vega-scale `scale` function.
 */
export function isRegisteredScale(scale) {
  return scale && scale[VEGA_SCALE] === true;
}

/**
 * Augment scales with their type and needed inverse methods.
 */
function create(type, constructor, metadata) {
  const ctr = function scale() {
    const s = constructor();

    if (!s.invertRange) {
      s.invertRange = s.invert ? invertRange(s)
        : s.invertExtent ? invertRangeExtent(s)
        : undefined;
    }

    s.type = type;
    return registerScale(s);
  };

  ctr.metadata = toSet(array(metadata));

  return ctr;
}

/**
 * Registry function for adding and accessing scale constructor functions.
 * The *type* argument is a String indicating the name of the scale type.
 *
 * If the *scale* argument is not specified, this method returns the matching scale constructor in the registry, or `null` if not found.
 * If the *scale* argument is provided, it must be a scale constructor function to add to the registry under the given *type* name.
 * The *metadata* argument provides additional information to guide appropriate use of scales within Vega.
 *
 *  *metadata* can be either a string or string array. The valid string values are:
 * - `"continuous"` - the scale is defined over a continuous-valued domain.
 * - `"discrete"` - the scale is defined over a discrete domain and range.
 * - `"discretizing"` - the scale discretizes a continuous domain to a discrete range.
 * - `"interpolating"` - the scale range is defined using a color interpolator.
 * - `"log"` - the scale performs a logarithmic transform of the continuous domain.
 * - `"temporal"` - the scale domain is defined over date-time values.
 */
export function scale(type, scale, metadata) {
  if (arguments.length > 1) {
    scales.set(type, create(type, scale, metadata));
    return this;
  } else {
    return isValidScaleType(type) ? scales.get(type) : undefined;
  }
}

// identity scale
scale(Identity, $.scaleIdentity);

// continuous scales
scale(Linear, $.scaleLinear, C);
scale(Log, $.scaleLog, [C, Log]);
scale(Pow, $.scalePow, C);
scale(Sqrt, $.scaleSqrt, C);
scale(Symlog, $.scaleSymlog, C);
scale(Time, $.scaleTime, [C, T]);
scale(UTC, $.scaleUtc, [C, T]);

// sequential scales
scale(Sequential, $.scaleSequential, [C, I]); // backwards compat
scale(`${Sequential}-${Linear}`, $.scaleSequential, [C, I]);
scale(`${Sequential}-${Log}`, $.scaleSequentialLog, [C, I, Log]);
scale(`${Sequential}-${Pow}`, $.scaleSequentialPow, [C, I]);
scale(`${Sequential}-${Sqrt}`, $.scaleSequentialSqrt, [C, I]);
scale(`${Sequential}-${Symlog}`, $.scaleSequentialSymlog, [C, I]);

// diverging scales
scale(`${Diverging}-${Linear}`, $.scaleDiverging, [C, I]);
scale(`${Diverging}-${Log}`, $.scaleDivergingLog, [C, I, Log]);
scale(`${Diverging}-${Pow}`, $.scaleDivergingPow, [C, I]);
scale(`${Diverging}-${Sqrt}`, $.scaleDivergingSqrt, [C, I]);
scale(`${Diverging}-${Symlog}`, $.scaleDivergingSymlog, [C, I]);

// discretizing scales
scale(Quantile, $.scaleQuantile, [Z, Quantile]);
scale(Quantize, $.scaleQuantize, Z);
scale(Threshold, $.scaleThreshold, Z);

// discrete scales
scale(BinOrdinal, scaleBinOrdinal, [D, Z]);
scale(Ordinal, $.scaleOrdinal, D);
scale(Band, scaleBand, D);
scale(Point, scalePoint, D);

export function isValidScaleType(type) {
  return scales.has(type);
}

function hasType(key, type) {
  const s = scales.get(key);
  return s && s.metadata[type];
}

export function isContinuous(key) {
  return hasType(key, C);
}

export function isDiscrete(key) {
  return hasType(key, D);
}

export function isDiscretizing(key) {
  return hasType(key, Z);
}

export function isLogarithmic(key) {
  return hasType(key, Log);
}

export function isTemporal(key) {
  return hasType(key, T);
}

export function isInterpolating(key) {
  return hasType(key, I);
}

export function isQuantile(key) {
  return hasType(key, Quantile);
}

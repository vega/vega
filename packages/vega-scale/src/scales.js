import * as $ from 'd3-scale';
import {default as scaleBand, point as scalePoint} from './band';
import scaleIndex from './index';

var scales = {
  // extended scale types
  band:        scaleBand,
  point:       scalePoint,
  index:       scaleIndex,

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
  sequential:  $.scaleSequential
};

export default function(name, scale) {
  return arguments.length > 1 ? (scales[name] = scale, this)
    : scales.hasOwnProperty(name) ? scales[name] : null;
}

export {default as bandSpace} from './src/scales/bandSpace';
export {timeInterval} from './src/scales/timeInterval';

export {
  Identity,
  Linear,
  Log,
  Pow,
  Sqrt,
  Symlog,
  Time,
  UTC,
  Sequential,
  Diverging,
  Quantile,
  Quantize,
  Threshold,
  BinOrdinal,
  Ordinal,
  Band,
  Point,
  isValidScaleType,
  isTemporal,
  isQuantile,
  isSequential,
  isDiverging,
  isInterpolating,
  isContinuous,
  isLogarithmic,
  isDiscrete,
  isDiscretizing
} from './src/scales/types';

export {
  interpolate,
  interpolateColors,
  interpolateRange,
  scaleCopy,
  scaleFraction,
  quantizeInterpolator
} from './src/interpolate';

export {default as scale} from './src/scales';

export {scheme} from './src/schemes';

export {scaleImplicit, tickFormat} from 'd3-scale';

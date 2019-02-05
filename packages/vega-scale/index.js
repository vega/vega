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
  isBinned,
  isQuantile,
  isSequential,
  isDiverging,
  isInterpolating,
  isContinuous,
  isLogarithmic,
  isDiscrete,
  isDiscretizing
} from './src/scales/types';

export {default as scale} from './src/scales';
export {interpolate, interpolateRange, scaleCopy, scaleFraction} from './src/interpolate';
export {scheme, schemeDiscretized} from './src/schemes';

export {scaleImplicit} from 'd3-scale';

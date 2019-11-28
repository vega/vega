export {default as bandSpace} from './src/scales/bandSpace';

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
  Point
} from './src/scales/types';

export {
  interpolate,
  interpolateColors,
  interpolateRange,
  scaleCopy,
  scaleFraction,
  quantizeInterpolator
} from './src/interpolate';

export {
  scale,
  isValidScaleType,
  isContinuous,
  isDiscrete,
  isDiscretizing,
  isInterpolating,
  isLogarithmic,
  isQuantile,
  isTemporal
} from './src/scales';

export {scheme} from './src/schemes';

export {scaleImplicit, tickFormat} from 'd3-scale';

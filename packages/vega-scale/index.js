export {
  default as bandSpace
} from './src/scales/bandSpace.js';

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
} from './src/scales/types.js';

export {
  interpolate,
  interpolateColors,
  interpolateRange,
  scaleCopy,
  scaleFraction,
  quantizeInterpolator
} from './src/interpolate.js';

export {
  scale,
  registerScale,
  isRegisteredScale,
  isValidScaleType,
  isContinuous,
  isDiscrete,
  isDiscretizing,
  isInterpolating,
  isLogarithmic,
  isQuantile,
  isTemporal
} from './src/scales.js';

export {
  scheme
} from './src/schemes.js';

export {
  SymbolLegend,
  DiscreteLegend,
  GradientLegend
} from './src/legend-types.js';

export {
  tickCount,
  tickFormat,
  tickValues,
  validTicks
} from './src/ticks.js';

export {
  labelFormat,
  labelFraction,
  labelValues
} from './src/labels.js';

export {
  domainCaption
} from './src/caption.js';

export {
  scaleImplicit
} from 'd3-scale';

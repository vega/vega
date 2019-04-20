export const Identity = 'identity';

export const Linear = 'linear';
export const Log = 'log';
export const Pow = 'pow';
export const Sqrt = 'sqrt';
export const Symlog = 'symlog';

export const Time = 'time';
export const UTC = 'utc';

export const Sequential = 'sequential';
export const Diverging = 'diverging';

export const Quantile = 'quantile';
export const Quantize = 'quantize';
export const Threshold = 'threshold';

export const Ordinal = 'ordinal';
export const Point = 'point';
export const Band = 'band';
export const BinOrdinal = 'bin-ordinal';

export function isValidScaleType(type) {
  switch (type) {
    case Identity:
    case Linear:
    case Log:
    case Pow:
    case Sqrt:
    case Symlog:
    case Time:
    case UTC:
    case Sequential:
    case Quantile:
    case Quantize:
    case Threshold:
    case Ordinal:
    case Point:
    case Band:
    case BinOrdinal:
      return true;
  }
  return false;
}

export function isTemporal(key) {
  return key === Time || key === UTC;
}

export function isBinned(key) {
  return key === BinOrdinal;
}

export function isQuantile(key) {
  return key === Quantile;
}

export function isSequential(key) {
  return key && key.startsWith(Sequential);
}

export function isDiverging(key) {
  return key && key.startsWith(Diverging);
}

export function isInterpolating(key) {
  return isSequential(key) || isDiverging(key);
}

export function isLogarithmic(key) {
  return key === Log || key.endsWith('-log');
}

export function isContinuous(key) {
  switch (key) {
    case Linear:
    case Log:
    case Pow:
    case Sqrt:
    case Symlog:
    case Time:
    case UTC:
    case Sequential:
      return true;
  }
  return false;
}

export function isDiscrete(key) {
  return key === BinOrdinal
    || key === Ordinal
    || key === Band
    || key === Point;
}

export function isDiscretizing(key) {
  return key === BinOrdinal
    || key === Quantile
    || key === Quantize
    || key === Threshold;
}

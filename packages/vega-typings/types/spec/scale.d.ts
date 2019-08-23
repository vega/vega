import { SignalRef } from '.';
import { ColorScheme } from './scheme';

export type RangeEnum =
  | 'width'
  | 'height'
  | 'symbol'
  | 'category'
  | 'ordinal'
  | 'ramp'
  | 'diverging'
  | 'heatmap';
export type RangeRawArray = (number | SignalRef)[];
export type RangeRaw = (null | boolean | string | number | SignalRef | RangeRawArray)[];
export type RangeScheme =
  | RangeEnum
  | RangeRaw
  | SignalRef
  | {
      scheme: string | string[] | SignalRef | ColorScheme;
      count?: number | SignalRef;
      extent?: (number | SignalRef)[] | SignalRef;
    };
export type RangeBand =
  | RangeEnum
  | RangeRaw
  | {
      step: number | SignalRef;
    };
export type SortOrder = 'ascending' | 'descending' | SignalRef;
export type SortField =
  | boolean
  | {
      field?: ScaleField;
      op: ScaleField;
      order?: SortOrder;
    };

/**
 * Unioned domains can only be sorted by count, min, or max aggregates.
 */
export type UnionSortField =
  | boolean
  | {
      op: 'count';
      order?: SortOrder;
    }
  | {
      field: ScaleField;
      op: 'count' | 'min' | 'max';
      order?: SortOrder;
    };
export type ScaleField = string | SignalRef;

export type ScaleBins =
  | (number | SignalRef)[]
  | SignalRef
  | {
      step: number | SignalRef;
      start?: number | SignalRef;
      stop?: number | SignalRef;
    };

export type ScaleInterpolate =
  | 'rgb'
  | 'lab'
  | 'hcl'
  | 'hsl'
  | 'hsl-long'
  | 'hcl-long'
  | 'cubehelix'
  | 'cubehelix-long'
  | SignalRef
  | {
      type: 'rgb' | 'cubehelix' | 'cubehelix-long' | SignalRef;
      gamma?: number | SignalRef;
    };
export interface DataRef {
  data: string;
  field: ScaleField;
}
export type MultiDataRef =
  | {
      data: string;
      fields: ScaleField[];
    }
  | {
      fields: ((string | number | boolean)[] | DataRef | SignalRef)[];
    };
export type ScaleData =
  | (DataRef & { sort?: SortField })
  | (MultiDataRef & { sort?: UnionSortField });
export type QuantScaleType =
  | 'linear'
  | 'pow'
  | 'sqrt'
  | 'log'
  | 'symlog'
  | 'time'
  | 'utc'
  | 'sequential';
export type DiscreteScaleType = 'ordinal' | 'band' | 'point';
export type DiscretizingScaleType = 'quantile' | 'quantize' | 'threshold' | 'bin-ordinal';
export type ScaleType = QuantScaleType | DiscreteScaleType | DiscretizingScaleType | 'identity';
export interface BaseScale {
  name: string;
  type?: ScaleType;
  domain?: (null | string | number | boolean | SignalRef)[] | ScaleData | SignalRef;
  domainMin?: number | SignalRef;
  domainMax?: number | SignalRef;
  domainMid?: number | SignalRef;
  domainRaw?: null | any[] | SignalRef;
  reverse?: boolean | SignalRef;
  round?: boolean | SignalRef;
}
export interface ContinuousScale extends BaseScale {
  range?: RangeScheme;
  bins?: ScaleBins;
  interpolate?: ScaleInterpolate;
  clamp?: boolean | SignalRef;
  padding?: number | SignalRef;
}
export interface NumericScale extends ContinuousScale {
  nice?: boolean | number | SignalRef;
  zero?: boolean | SignalRef;
}
export interface BaseBandScale extends BaseScale {
  range?: RangeBand;
  padding?: number | SignalRef;
  paddingOuter?: number | SignalRef;
  align?: number | SignalRef;
}
// concrete scales
export interface OrdinalScale extends BaseScale {
  type: 'ordinal';
  range?: RangeScheme | ScaleData;
  interpolate?: ScaleInterpolate;
  domainImplicit?: boolean | SignalRef;
}
export interface BandScale extends BaseBandScale {
  type: 'band';
  paddingInner?: number | SignalRef;
}
export interface PointScale extends BaseBandScale {
  type: 'point';
}

// note: deprecated
export interface SequentialScale extends NumericScale {
  type: 'sequential';
}
export type TimeInterval =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year';
export interface TimeScale extends ContinuousScale {
  type: 'time' | 'utc';
  nice?: boolean | TimeInterval | SignalRef;
}
export interface IdentityScale extends BaseScale {
  type: 'identity';
  nice?: boolean | SignalRef;
}
export interface LinearScale extends NumericScale {
  type?: 'linear'; // optional because it's the default
}
export interface LogScale extends ContinuousScale {
  type: 'log';
  base?: number | SignalRef;
  nice?: boolean | number | SignalRef;
  zero?: false; // zero has to be false or undefined
}

export interface SymLogScale extends NumericScale {
  type: 'symlog';
  constant?: number | SignalRef;
}
export interface PowScale extends NumericScale {
  type: 'pow';
  exponent: number | SignalRef;
}
export interface SqrtScale extends NumericScale {
  type: 'sqrt';
}
export interface QuantizeScale extends BaseScale {
  type?: 'quantize';
  range?: RangeScheme;
  padding?: number | SignalRef;
  nice?: boolean | number | SignalRef;
  zero?: boolean | SignalRef;
}
export interface ThresholdScale extends BaseScale {
  type?: 'threshold';
  range?: RangeScheme;
  padding?: number | SignalRef;
  nice?: boolean | number | SignalRef;
  zero?: boolean | SignalRef;
}
export interface QuantileScale extends BaseScale {
  type?: 'quantile';
  range?: RangeScheme;
  interpolate?: ScaleInterpolate;
}
export interface BinOrdinalScale extends BaseScale {
  type: 'bin-ordinal';
  bins?: ScaleBins;
  range?: RangeScheme | ScaleData;
  interpolate?: ScaleInterpolate;
}
export type Scale =
  | OrdinalScale
  | BandScale
  | PointScale
  | SequentialScale
  | TimeScale
  | IdentityScale
  | LinearScale
  | LogScale
  | SymLogScale
  | PowScale
  | SqrtScale
  | QuantileScale
  | QuantizeScale
  | ThresholdScale
  | BinOrdinalScale;

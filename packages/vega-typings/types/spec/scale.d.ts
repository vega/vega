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
export type RangeRaw = (null | boolean | string | number | SignalRef)[];
export type RangeScheme =
  | RangeEnum
  | RangeRaw
  | SignalRef
  | {
      scheme: string | SignalRef | ColorScheme;
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
 * Unioned domains can only be sorted by count aggregate.
 */
export type UnionSortField =
  | boolean
  | {
      op: 'count';
      order?: SortOrder;
    };
export type ScaleField = string | SignalRef;

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
export type QuantScaleType = 'linear' | 'pow' | 'sqrt' | 'log' | 'time' | 'utc' | 'sequential';
export type DiscreteScaleType = 'ordinal' | 'band' | 'point';
export type DiscretizingScaleType =
  | 'quantile'
  | 'quantize'
  | 'threshold'
  | 'bin-linear'
  | 'bin-ordinal';
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
export interface OrdinalScale extends BaseScale {
  type: 'ordinal';
  range?: RangeScheme | ScaleData;
}
export interface BandScale extends BaseScale {
  type: 'band';
  range?: RangeBand;
  padding?: number | SignalRef;
  paddingInner?: number | SignalRef;
  paddingOuter?: number | SignalRef;
  align?: number | SignalRef;
}
export interface PointScale extends BaseScale {
  type: 'point';
  range?: RangeBand;
  padding?: number | SignalRef;
  paddingOuter?: number | SignalRef;
  align?: number | SignalRef;
}
export interface SequentialScale extends BaseScale {
  type: 'sequential';
  range: RangeScheme;
  clamp?: boolean | SignalRef;
  padding?: number | SignalRef;
  zero?: boolean | SignalRef;
  nice?: boolean | TimeInterval | SignalRef;
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
export interface TimeScale extends BaseScale {
  type: 'time' | 'utc';
  range?: RangeScheme;
  clamp?: boolean | SignalRef;
  padding?: number | SignalRef;
  nice?: boolean | TimeInterval | SignalRef;
}
export interface IdentityScale extends BaseScale {
  type: 'identity';
  nice?: TimeInterval;
}
export interface DiscretizingScale extends BaseScale {
  type: DiscreteScaleType;
  range?: RangeScheme;
  nice?: boolean | TimeInterval | SignalRef;
  zero?: boolean | SignalRef;
}
export interface LinearScale extends BaseScale {
  type?: 'linear'; // optional because it's the default
  range?: RangeScheme;
  interpolate?: ScaleInterpolate;
  clamp?: boolean | SignalRef;
  padding?: number | SignalRef;
  nice?: boolean | number | SignalRef;
  zero?: boolean | SignalRef;
}
export interface LogScale extends BaseScale {
  type: 'log';
  range?: RangeScheme;
  interpolate?: ScaleInterpolate;
  base?: number | SignalRef;
  clamp?: boolean | SignalRef;
  padding?: number | SignalRef;
  nice?: boolean | number | SignalRef;
}
export interface PowScale extends BaseScale {
  type: 'pow';
  exponent: number;
  range?: RangeScheme;
  interpolate?: ScaleInterpolate;
  clamp?: boolean | SignalRef;
  padding?: number | SignalRef;
  nice?: boolean | number | SignalRef;
  zero?: boolean | SignalRef;
}
export interface SqrtScale extends BaseScale {
  type: 'sqrt';
  range?: RangeScheme;
  interpolate?: ScaleInterpolate;
  clamp?: boolean | SignalRef;
  padding?: number | SignalRef;
  nice?: boolean | number | SignalRef;
  zero?: boolean | SignalRef;
}
export interface QuantileScale extends BaseScale {
  type?: 'quantile';
  range?: RangeScheme;
  nice?: boolean | number | SignalRef;
  zero?: boolean | SignalRef;
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
export interface BinLinearScale extends BaseScale {
  type: 'bin-linear';
  range?: RangeScheme;
  padding?: number | SignalRef;
  interpolate?: ScaleInterpolate;
}
export interface BinOrdinalScale extends BaseScale {
  type: 'bin-ordinal';
  range?: RangeScheme | ScaleData;
}
export type Scale =
  | OrdinalScale
  | BandScale
  | PointScale
  | SequentialScale
  | TimeScale
  | IdentityScale
  | DiscretizingScale
  | LinearScale
  | LogScale
  | PowScale
  | SqrtScale
  | QuantileScale
  | QuantizeScale
  | ThresholdScale
  | BinLinearScale
  | BinOrdinalScale;

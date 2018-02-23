import {
  Expr,
  ProductionRule,
  NumericValueRef,
  ScaledValueRef,
  StringValueRef,
  SignalRef,
  SortOrder,
  SingleSort,
  MultiSort,
  DataRef,
  EventStream,
  FieldValue,
  Compare,
  LegendOrient,
  FontStyle,
  FontWeight,
} from '.';

export type FieldRef =
  | FieldValue
  | {
      field: FieldValue;
    };

export type AggregateOp =
  | 'argmax'
  | 'argmin'
  | 'average'
  | 'count'
  | 'distinct'
  | 'max'
  | 'mean'
  | 'median'
  | 'min'
  | 'missing'
  | 'q1'
  | 'q3'
  | 'ci0'
  | 'ci1'
  | 'stdev'
  | 'stdevp'
  | 'sum'
  | 'valid'
  | 'values'
  | 'variance'
  | 'variancep';

export interface BaseBin {
  /**
   * The number base to use for automatic bin determination (default is base 10).
   *
   * __Default value:__ `10`
   *
   */
  base?: number;
  /**
   * An exact step size to use between bins.
   *
   * __Note:__ If provided, options such as maxbins will be ignored.
   */
  step?: number;
  /**
   * An array of allowable step sizes to choose from.
   * @minItems 1
   */
  steps?: number[];
  /**
   * A minimum allowable step size (particularly useful for integer values).
   */
  minstep?: number;
  /**
   * Scale factors indicating allowable subdivisions. The default value is [5, 2], which indicates that for base 10 numbers (the default base), the method may consider dividing bin sizes by 5 and/or 2. For example, for an initial step size of 10, the method can check if bin sizes of 2 (= 10/5), 5 (= 10/2), or 1 (= 10/(5*2)) might also satisfy the given constraints.
   *
   * __Default value:__ `[5, 2]`
   *
   * @minItems 1
   */
  divide?: number[];
  /**
   * Maximum number of bins.
   *
   * __Default value:__ `6` for `row`, `column` and `shape` channels; `10` for other channels
   *
   * @minimum 2
   */
  maxbins?: number;
  /**
   * If true (the default), attempts to make the bin boundaries use human-friendly boundaries, such as multiples of ten.
   */
  nice?: boolean;
}

export interface VgBinTransform extends BaseBin {
  type: 'bin';
  extent?: number[] | { signal: string };
  field: string;
  as: string[];
  signal?: string;
}

export interface VgExtentTransform {
  type: 'extent';
  field: string;
  signal: string;
}

export interface VgFoldTransform {
  type: 'fold';
  fields: FieldRef[] | SignalRef;
  as: [string, string];
}

export interface VgFormulaTransform {
  type: 'formula';
  as: string;
  expr: string;
}

export interface VgFilterTransform {
  type: 'filter';
  expr: string;
}

export interface VgAggregateTransform {
  type: 'aggregate';
  groupby?: FieldRef[];
  fields?: FieldRef[];
  ops?: AggregateOp[];
  as?: string[];
  cross?: boolean;
  drop?: boolean;
}

export interface VgCollectTransform {
  type: 'collect';
  sort: Compare;
}

export interface VgCountPatternTransform {
  type: 'countpattern';
  field: FieldRef;
  case?: string;
  pattern?: string;
  stopwords?: string;
  as?: string[];
}

export interface VgLookupTransform {
  type: 'lookup';
  from: string;
  key: string;
  fields: string[];
  values?: string[];
  as?: string[];
  default?: string;
}

export type StackOffset = 'zero' | 'center' | 'normalize';

export interface VgStackTransform {
  type: 'stack';
  offset?: StackOffset;
  groupby: string[];
  field: string;
  sort: Compare;
  as: string[];
}

export interface VgIdentifierTransform {
  type: 'identifier';
  as: string;
}

export interface VgWindowTransform extends SingleSort {
  type: 'window';
  groupby?: FieldRef[];
  ops?: (string | SignalRef)[];
  fields?: (FieldRef | null)[];
  params?: any[];
  as?: (string | null)[];
  frame?: [number | null | SignalRef, number | null | SignalRef];
  ignorePeers?: boolean;
}

export interface VgWordcloudTransform {
  type: 'wordcloud';
  size?: [number | ProductionRule<NumericValueRef>, number | ProductionRule<NumericValueRef>];
  font?: string | ProductionRule<StringValueRef>;
  fontStyle?: FontStyle | ProductionRule<ScaledValueRef<FontWeight>>;
  fontWeight?: FontWeight | ProductionRule<ScaledValueRef<FontWeight>>;
  fontSize?: number | ProductionRule<NumericValueRef>;
  fontSizeRange?: [
    number | ProductionRule<NumericValueRef>,
    number | ProductionRule<NumericValueRef>
  ];
  padding?: number | ProductionRule<NumericValueRef>;
  rotate?: number | ProductionRule<NumericValueRef>;
  text?: FieldRef;
  spiral?: string;
  as?: string[];
}

export type Transform =
  | VgBinTransform
  | VgExtentTransform
  | VgFoldTransform
  | VgFormulaTransform
  | VgAggregateTransform
  | VgFilterTransform
  | VgImputeTransform
  | VgStackTransform
  | VgCollectTransform
  | VgCountPatternTransform
  | VgLookupTransform
  | VgIdentifierTransform
  | VgGeoPointTransform
  | VgGeoJSONTransform
  | VgGeoJSONTransform
  | VgWindowTransform
  | VgWordcloudTransform;

export interface VgGeoPointTransform {
  type: 'geopoint';
  projection: string; // projection name
  fields: FieldRef[];
  as?: string[];
}

export interface VgGeoShapeTransform {
  type: 'geoshape';
  projection: string; // projection name
  field?: FieldRef;
  as?: string;
}

export interface VgGeoJSONTransform {
  type: 'geojson';
  fields?: FieldRef[];
  geojson?: FieldRef;
  signal: string;
}

export type VgPostEncodingTransform = VgGeoShapeTransform;

export interface VgAxisEncode {
  ticks?: VgGuideEncode;
  labels?: VgGuideEncode;
  title?: VgGuideEncode;
  grid?: VgGuideEncode;
  domain?: VgGuideEncode;
}

export interface VgLegendEncode {
  title?: VgGuideEncode;
  labels?: VgGuideEncode;
  legend?: VgGuideEncode;
  symbols?: VgGuideEncode;
  gradient?: VgGuideEncode;
}

export type VgGuideEncode = any; // TODO: replace this (See guideEncode in Vega Schema)

export interface VgImputeTransform {
  type: 'impute';
  groupby?: string[];
  field: string;
  key: string;
  keyvals?: string[];
  method?: 'value' | 'median' | 'max' | 'min' | 'mean';
  value?: any;
}

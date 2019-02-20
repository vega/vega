import { SignalRef, Compare, Vector2, ExprRef, FontWeight, FontStyle, Vector7 } from '.';

export type Transforms =
  | AggregateTransform
  | BinTransform
  | CollectTransform
  | CountPatternTransform
  | ContourTransform
  | _TODO_<'cross'>
  | _TODO_<'crossfilter'>
  | _TODO_<'density'>
  | ExtentTransform
  | FilterTransform
  | FlattenTransform
  | FoldTransform
  | _TODO_<'force'>
  | FormulaTransform
  | GeoJSONTransform
  | _TODO_<'geopath'>
  | GeoPointTransform
  | GeoShapeTransform
  | GraticuleTransform
  | IdentifierTransform
  | ImputeTransform
  | JoinAggregateTransform
  | _TODO_<'linkpath'>
  | LookupTransform
  | _TODO_<'nest'>
  | _TODO_<'pack'>
  | _TODO_<'partition'>
  | _TODO_<'pie'>
  | _TODO_<'project'>
  | _TODO_<'resolvefilter'>
  | SampleTransform
  | _TODO_<'sequence'>
  | StackTransform
  | _TODO_<'stratify'>
  | _TODO_<'tree'>
  | _TODO_<'treelinks'>
  | _TODO_<'treemap'>
  | _TODO_<'voronoi'>
  | WindowTransform
  | WordcloudTransform;

export interface AggregateTransform {
  type: 'aggregate';
  signal?: string;
  groupby?: (string | TransformField)[] | SignalRef;
  fields?: ((string | TransformField) | null)[] | SignalRef;
  ops?: (AggregateOp | SignalRef)[] | SignalRef;
  as?: (string | SignalRef | null)[] | SignalRef;
  drop?: boolean | SignalRef;
  cross?: boolean | SignalRef;
  key?: string | TransformField;
}
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
  | 'stderr'
  | 'stdev'
  | 'stdevp'
  | 'sum'
  | 'valid'
  | 'values'
  | 'variance'
  | 'variancep';

export interface BinTransform extends BaseBin {
  type: 'bin';
  extent: Vector2<number | SignalRef> | SignalRef;
  field: string | TransformField;
  as?: Vector2<string | SignalRef> | SignalRef;
  signal?: string;
  anchor?: number | SignalRef;
  name?: string | SignalRef;
}
export interface BaseBin {
  /**
   * The number base to use for automatic bin determination (default is base 10).
   *
   * __Default value:__ `10`
   *
   */
  base?: number | SignalRef;
  /**
   * An exact step size to use between bins.
   *
   * __Note:__ If provided, options such as maxbins will be ignored.
   */
  step?: number | SignalRef;
  /**
   * An array of allowable step sizes to choose from.
   * @minItems 1
   */
  steps?: (number | SignalRef)[] | SignalRef;
  /**
   * A minimum allowable step size (particularly useful for integer values).
   */
  minstep?: number | SignalRef;
  /**
   * Scale factors indicating allowable subdivisions. The default value is [5, 2], which indicates that for base 10 numbers (the default base), the method may consider dividing bin sizes by 5 and/or 2. For example, for an initial step size of 10, the method can check if bin sizes of 2 (= 10/5), 5 (= 10/2), or 1 (= 10/(5*2)) might also satisfy the given constraints.
   *
   * __Default value:__ `[5, 2]`
   *
   * @minItems 1
   */
  divide?: Vector2<number | SignalRef> | SignalRef;
  /**
   * Maximum number of bins.
   *
   * __Default value:__ `6` for `row`, `column` and `shape` channels; `10` for other channels
   *
   * @minimum 2
   */
  maxbins?: number | SignalRef;
  /**
   * If true (the default), attempts to make the bin boundaries use human-friendly boundaries, such as multiples of ten.
   */
  nice?: boolean | SignalRef;
}

export interface CollectTransform {
  type: 'collect';
  sort: Compare;
}

export interface CountPatternTransform {
  type: 'countpattern';
  field: string | TransformField;
  case?: string;
  pattern?: string;
  stopwords?: string;
  as?: string[];
}

export type ContourTransform = {
  type: 'contour';
  signal?: string;
  size: (number | SignalRef)[] | SignalRef; // TODO: change to Vector2<SignalRef | number> after https://github.com/Microsoft/TypeScript/issues/28017 has been fixed
  values?: (number | SignalRef)[] | SignalRef;
  x?: string | TransformField;
  y?: string | TransformField;
  cellSize?: number | SignalRef;
  bandwidth?: number | SignalRef;
} & (
  | {
      count?: number | SignalRef;
      nice?: number | SignalRef;
    }
  | {
      thresholds?: (number | SignalRef)[] | SignalRef;
    });

export interface ExtentTransform {
  type: 'extent';
  field: string | TransformField;
  signal: string;
}

export interface FilterTransform {
  type: 'filter';
  expr: string;
}

export interface FlattenTransform {
  type: 'flatten';
  fields: (string | TransformField)[] | SignalRef;
  as?: string[];
}

export interface FoldTransform {
  type: 'fold';
  fields: (string | TransformField)[] | SignalRef;
  as?: [string, string];
}

export interface FormulaTransform {
  type: 'formula';
  expr: string;
  as: string;
  initonly?: boolean;
}

export interface GeoJSONTransform {
  type: 'geojson';
  fields?: Vector2<string | TransformField> | SignalRef;
  geojson?: TransformField;
  signal: string;
}

export interface GeoPointTransform {
  type: 'geopoint';
  projection: string; // projection name
  fields: Vector2<string | TransformField> | SignalRef;
  as?: string[];
}

export interface GeoShapeTransform {
  type: 'geoshape';
  projection?: string;
  field?: string | TransformField;
  pointRadius?: number | SignalRef | ExprRef;
  as?: string;
}

export interface GraticuleTransform {
  type: 'graticule';
  signal?: string;
  extent?: Vector2<any> | SignalRef;
  extentMajor?: Vector2<any> | SignalRef;
  extentMinor?: Vector2<any> | SignalRef;
  step?: Vector2<number | SignalRef> | SignalRef;
  stepMajor?: Vector2<number | SignalRef> | SignalRef;
  stepMinor?: Vector2<number | SignalRef> | SignalRef;
  precision?: number | SignalRef;
}

export interface IdentifierTransform {
  type: 'identifier';
  as: string;
}

export type ImputeMethod = 'value' | 'median' | 'max' | 'min' | 'mean';

export interface ImputeTransform {
  type: 'impute';
  groupby?: string[];
  field: string;
  key: string;
  keyvals?: any[] | SignalRef;
  method?: ImputeMethod;
  value?: any;
}

export interface JoinAggregateTransform {
  type: 'joinaggregate';
  groupby?: (string | TransformField)[] | SignalRef;
  ops?: (AggregateOp | SignalRef)[];
  fields?: (string | TransformField | null)[] | SignalRef;
  as?: (string | SignalRef | null)[] | SignalRef;
}

export interface LookupTransform {
  type: 'lookup';
  from: string;
  key: string;
  fields: string[];
  values?: string[];
  as?: (string | SignalRef)[] | SignalRef;
  default?: any;
}

export interface SampleTransform {
  type: 'sample';
  size: number | SignalRef;
}

export interface StackTransform {
  type: 'stack';
  field?: string | TransformField;
  groupby?: (string | TransformField)[];
  sort?: Compare;
  offset?: StackOffset;
  as?: Vector2<string | SignalRef> | SignalRef;
}
export type StackOffset = 'zero' | 'center' | 'normalize';

export type WindowOnlyOp =
  | 'row_number'
  | 'rank'
  | 'dense_rank'
  | 'percent_rank'
  | 'cume_dist'
  | 'ntile'
  | 'lag'
  | 'lead'
  | 'first_value'
  | 'last_value'
  | 'nth_value';

export interface WindowTransform {
  type: 'window';
  sort?: Compare;
  groupby?: (string | TransformField)[] | SignalRef;
  ops?: (AggregateOp | WindowOnlyOp | SignalRef)[];
  params?: (number | SignalRef | null)[] | SignalRef;
  fields?: (string | TransformField | null)[] | SignalRef;
  as?: (string | SignalRef | null)[] | SignalRef;
  frame?: Vector2<number | SignalRef | null> | SignalRef;
  ignorePeers?: boolean | SignalRef;
}

export interface WordcloudTransform {
  type: 'wordcloud';
  signal?: string;
  size?: Vector2<number | SignalRef> | SignalRef;
  font?: string | TransformField;
  fontStyle?: FontStyle | TransformField;
  fontWeight?: FontWeight | TransformField;
  fontSize?: number | TransformField;
  fontSizeRange?: Vector2<number | SignalRef> | SignalRef;
  rotate?: number | TransformField;
  text?: string | TransformField;
  spiral?: 'archimedian' | 'rectangular';
  padding?: number | TransformField;
  as?: Vector7<string | SignalRef> | SignalRef;
}

export interface FieldParam {
  field: string;
}
export type TransformField = SignalRef | FieldParam | ExprRef;

/** This transform has yet to be implemented */
export interface _TODO_<Type extends string> {
  type: Type;
  [k: string]: any;
}

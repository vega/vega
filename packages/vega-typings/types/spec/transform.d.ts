import {
  AggregateOp,
  BaseBin,
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

export type Transform =
  | any
  | AggregateTransform
  | BinTransform
  | CollectTransform
  | CountPatternTransform
  // TODO contour
  // TODO cross
  // TODO crossfilter
  // TODO density
  | ExtentTransform
  | FilterTransform
  // TODO flatten
  | FoldTransform
  // TODO force
  | FormulaTransform
  | GeoJSONTransform
  // TODO geopath
  | GeoPointTransform
  | GeoShapeTransform
  | IdentifierTransform
  | ImputeTransform
  // TODO joinaggregate
  // TODO linkpath
  | LookupTransform
  // TODO nest
  // TODO pack
  // TODO partition
  // TODO pie
  // TODO project
  // TODO resolvefilter
  // TODO sample
  // TODO sequence
  | StackTransform
  // TODO stratify
  // TODO tree
  // TODO treelinks
  // TODO treemap
  // TODO voronoi
  | WindowTransform
  | WordcloudTransform;

export interface AggregateTransform {
  type: 'aggregate';
  groupby?: FieldRef[];
  fields?: FieldRef[];
  ops?: AggregateOp[];
  as?: string[];
  cross?: boolean;
  drop?: boolean;
}

export interface BinTransform extends BaseBin {
  type: 'bin';
  extent?: number[] | { signal: string };
  field: string;
  as: string[];
  signal?: string;
}

export interface CollectTransform {
  type: 'collect';
  sort: Compare;
}

export interface CountPatternTransform {
  type: 'countpattern';
  field: FieldRef;
  case?: string;
  pattern?: string;
  stopwords?: string;
  as?: string[];
}

export interface ExtentTransform {
  type: 'extent';
  field: string;
  signal: string;
}

export interface FilterTransform {
  type: 'filter';
  expr: string;
}

export interface FoldTransform {
  type: 'fold';
  fields: FieldRef[] | SignalRef;
  as: [string, string];
}

export interface FormulaTransform {
  type: 'formula';
  as: string;
  expr: string;
}

export interface GeoJSONTransform {
  type: 'geojson';
  fields?: FieldRef[];
  geojson?: FieldRef;
  signal: string;
}

export interface GeoPointTransform {
  type: 'geopoint';
  projection: string; // projection name
  fields: FieldRef[];
  as?: string[];
}

export interface GeoShapeTransform {
  type: 'geoshape';
  projection: string; // projection name
  field?: FieldRef;
  as?: string;
}

export interface IdentifierTransform {
  type: 'identifier';
  as: string;
}

export interface ImputeTransform {
  type: 'impute';
  groupby?: string[];
  field: string;
  key: string;
  keyvals?: string[];
  method?: 'value' | 'median' | 'max' | 'min' | 'mean';
  value?: any;
}

export interface LookupTransform {
  type: 'lookup';
  from: string;
  key: string;
  fields: string[];
  values?: string[];
  as?: string[];
  default?: string;
}

export type StackOffset = 'zero' | 'center' | 'normalize';

export interface StackTransform {
  type: 'stack';
  offset?: StackOffset;
  groupby: string[];
  field: string;
  sort: Compare;
  as: string[];
}

export interface WindowTransform extends SingleSort {
  type: 'window';
  groupby?: FieldRef[];
  ops?: (string | SignalRef)[];
  fields?: (FieldRef | null)[];
  params?: any[];
  as?: (string | null)[];
  frame?: [number | null | SignalRef, number | null | SignalRef];
  ignorePeers?: boolean;
}

export interface WordcloudTransform {
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

export type FieldRef =
  | FieldValue
  | {
      field: FieldValue;
    };

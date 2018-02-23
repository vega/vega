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
  Vector2,
} from '.';

export type Transform =
  | AggregateTransform
  | BinTransform
  | CollectTransform
  | CountPatternTransform
  | _TODO_<'contour'>
  | _TODO_<'cross'>
  | _TODO_<'crossfilter'>
  | _TODO_<'density'>
  | ExtentTransform
  | FilterTransform
  | _TODO_<'flatten'>
  | FoldTransform
  | _TODO_<'force'>
  | FormulaTransform
  | GeoJSONTransform
  | _TODO_<'geopath'>
  | GeoPointTransform
  | GeoShapeTransform
  | IdentifierTransform
  | ImputeTransform
  | _TODO_<'joinaggregate'>
  | _TODO_<'linkpath'>
  | LookupTransform
  | _TODO_<'nest'>
  | _TODO_<'pack'>
  | _TODO_<'partition'>
  | _TODO_<'pie'>
  | _TODO_<'project'>
  | _TODO_<'resolvefilter'>
  | _TODO_<'sample'>
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
  groupby?: Field[];
  fields?: Field[];
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
  field: Field;
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
  fields: Field[] | SignalRef;
  as: [string, string];
}

export interface FormulaTransform {
  type: 'formula';
  as: string;
  expr: string;
}

export interface GeoJSONTransform {
  type: 'geojson';
  fields?: Field[];
  geojson?: Field;
  signal: string;
}

export interface GeoPointTransform {
  type: 'geopoint';
  projection: string; // projection name
  fields: Field[];
  as?: string[];
}

export interface GeoShapeTransform {
  type: 'geoshape';
  projection: string; // projection name
  field?: Field;
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

export interface StackTransform {
  type: 'stack';
  field?: Field;
  groupby?: Field[];
  sort?: Compare;
  offset?: StackOffset;
  as?: Vector2<string>;
}
export type StackOffset = 'zero' | 'center' | 'normalize';

export interface WindowTransform extends SingleSort {
  type: 'window';
  groupby?: Field[];
  ops?: (string | SignalRef)[];
  fields?: (Field | null)[];
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
  text?: Field;
  spiral?: string;
  as?: string[];
}

export type Field =
  | FieldValue
  | {
      field: FieldValue;
    };

/** This transform has yet to be implemented */
export interface _TODO_<Type extends string> {
  type: Type;
  [k: string]: any;
}

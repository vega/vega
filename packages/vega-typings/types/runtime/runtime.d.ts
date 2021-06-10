import { AggregateOp, EventType, WindowEventType, Transforms } from '..';
// All references to source code are from the vega-parser package

export type Runtime = {
  description: string;
  operators: Entry[];
  streams: Stream[];
  updates: any;
  bindings: any;
  eventConfig: any;
  locale?: any;
};

// These are called entries instead of operators because the JS class
// is also called Entry, defined in util.js:entry
type Entry = OperatorEntry | TransformEntry | DataTransformEntry;

type OperatorEntry = EntryType<
  'operator',
  | {
      // Adding root property in Scope.finish()
      // Adding root operator node in view.parseView
      root: true;
    }
  | ({
      // operators added by Scope.addSignal
      value?: unknown;
      // added in parsers/signal.js
      react?: false;
      // Scope.finish (signals that are removed dont have a name)
      signal?: string;
    } & (
      | {}
      // Saved to scope.signals in Scope.addSignal
      // retrieved and modified in parsers/signal-updates.js
      | {
          initonly?: true;
          update: Parse['$expr'];
          params: Parse['$params'];
        }
    ))
>;

// The parameters for all builtin vega data transforms
// from the parsers/transform.js function
// Possible todo: create per transform type definitions based on transform definitions
type DataTransformEntry = EntryType<
  // TODO: Do we allow external transforms as well?
  // The current vega spec definition does not.
  Transforms['type'],
  {
    value: null;
    params: {
      [name: string]: TransformParam;
    };
    // Copies metadata from transform definition
    metadata: { [k: string]: unknown };
  }
>;

// // parsers.transform.js:parseParameter
type TransformParam =
  // parseIndexParameter
  | Ref
  // parseSubParameters
  | Ref[]
  // parameterValue
  | Parse
  | unknown;

// All entries defined in transforms.js
type TransformEntry =
  | AggregateEntry
  | AxisTicksEntry
  | BoundEntry
  | CollectEntry
  | CompareEntry
  | DataJoinEntry
  | EncodeEntry
  | ExpressionEntry
  | ExtentEntry
  | FacetEntry
  | FieldEntry
  | KeyEntry
  | LegendEntriesEntry
  | LoadEntry
  | MarkEntry
  | MultiextentEntry
  | MultivaluesEntry
  | OverlapEntry
  | ParamsEntry
  | PrefacetEntry
  | ProjectionEntry
  | ProxyEntry
  | RelayEntry
  | RenderEntry
  | ScaleEntry
  | SieveEntry
  | SortItemsEntry
  | ViewLayoutEntry
  | ValuesEntry;

type AggregateEntry = EntryType<
  'aggregate',
  {
    params: // DataScope.countsRef
    | ({
          groupby: {
            $field: string;
            $name: 'key';
          };
          pulse: Ref;
        } & (
          | {}
          // DataScope.addSortFIeld
          | {
              ops: ['count', ...(AggregateOp | Ref)[]];
              // Fields can only be string field refs, not signals
              fields: [null, ...{ $field: string }[]];
              as: ['count', ...string[]];
            }
        ))
      // scale.ordinalMultipleDomain
      | {
          groupby: {
            $field: 'key';
          };
          pulse: Ref[];
          // DataScope.addSortFIeld
          ops: ['min' | 'max' | 'sum'];
          // Fields can only be string field refs, not signals
          fields: [{ $field: string }];
          as: [string];
        };
  }
>;
type AxisTicksEntry = EntryType<'axisticks', { [k: string]: unknown }>;
type BoundEntry = EntryType<'bound', { [k: string]: unknown }>;
type CollectEntry = EntryType<'collect', { [k: string]: unknown }>;
type CompareEntry = EntryType<'compare', { [k: string]: unknown }>;
type DataJoinEntry = EntryType<'datajoin', { [k: string]: unknown }>;
type EncodeEntry = EntryType<'encode', { [k: string]: unknown }>;
type ExpressionEntry = EntryType<'expression', { [k: string]: unknown }>;
type ExtentEntry = EntryType<'extent', { [k: string]: unknown }>;
type FacetEntry = EntryType<'facet', { [k: string]: unknown }>;
type FieldEntry = EntryType<'field', { [k: string]: unknown }>;
type KeyEntry = EntryType<'key', { [k: string]: unknown }>;
type LegendEntriesEntry = EntryType<'legendentries', { [k: string]: unknown }>;
type LoadEntry = EntryType<'load', { [k: string]: unknown }>;
type MarkEntry = EntryType<'mark', { [k: string]: unknown }>;
type MultiextentEntry = EntryType<'multiextent', { [k: string]: unknown }>;
type MultivaluesEntry = EntryType<'multivalues', { [k: string]: unknown }>;
type OverlapEntry = EntryType<'overlap', { [k: string]: unknown }>;
type ParamsEntry = EntryType<'params', { [k: string]: unknown }>;
type PrefacetEntry = EntryType<'prefacet', { [k: string]: unknown }>;
type ProjectionEntry = EntryType<'projection', { [k: string]: unknown }>;
type ProxyEntry = EntryType<'proxy', { [k: string]: unknown }>;
type RelayEntry = EntryType<'relay', { [k: string]: unknown }>;
type RenderEntry = EntryType<'render', { [k: string]: unknown }>;
type ScaleEntry = EntryType<'scale', { [k: string]: unknown }>;
type SieveEntry = EntryType<'sieve', { [k: string]: unknown }>;
type SortItemsEntry = EntryType<'sortitems', { [k: string]: unknown }>;
type ViewLayoutEntry = EntryType<'viewlayout', { [k: string]: unknown }>;
type ValuesEntry = EntryType<'values', { [k: string]: unknown }>;

type EntryType<NAME extends string, BODY extends { [k: string]: unknown }> = {
  id: id;
  type: NAME;
  // Scope.add
  refs?: null;
  // Scope.finish.annotate
  data?: { [name: string]: ('input' | 'output' | 'values' | `index:${string}`)[] };
} & BODY;

type Stream = {
  id: id;
} & (
  | // from parsers/stream.js:eventStream -> scope.event
  {
      source: 'timer';
      type: number;
    }
  | {
      source: 'view';
      type: EventType;
    }
  | {
      source: 'window';
      type: WindowEventType;
    }
  | ((
      | // from parsers/stream.js:eventStream & nestedStream -> streamParameters
      { stream: id }
      // from parsers/stream.js:mergeStream -> streamParameters
      | { merge: id[] }
    ) & {
      // from parsers/stream.js:streamParameters
      between?: [id, id];
      filter?: Parse['$expr'];
      throttle?: number;
      debounce?: number;
      consume?: true;
    })
);

type Ref = {
  $ref: id;
};

// from `Scope.js:Scope:id`
// String if sub id with `:` seperate parent from child id numbers
type id = string | number;

// from vega-functions:parser.js
type Parse = {
  // TODO: AST types
  // TODO: Make ast config as generic param?
  $expr: { code: string; ast?: unknown };
  $params: { [signalName: string]: Ref };
  $fields: string[];
};

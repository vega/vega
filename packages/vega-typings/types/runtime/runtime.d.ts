import { Config } from 'types/spec';
import { AggregateOp, EventType, WindowEventType, Transforms, Binding as SpecBinding } from '..';
// All references to source code are from the vega-parser package

export interface Runtime {
  description: string;
  operators: Entry[];
  // Event streams that Vega is listening to. Often DOM events
  streams: Stream[];
  updates: Update[];
  bindings: Binding[];
  eventConfig?: Config['events'];
  locale?: Config['locale'];
}

// These are called entries instead of operators because the JS class
// is also called Entry, defined in util.js:entry
export type Entry = OperatorEntry | TransformEntry | DataTransformEntry | CacheEntry;

// from DataScope.cache
export type CacheEntry = ExtentRefEntry | DomainRefEntry | ValuesRefEntry | LookupRefEntry;

// from DataScope.extentRef
export type ExtentRefEntry = EntryType<'extent', { params: { field: fieldRef; pulse: Ref } }>;

// from DataScope.domainRef
export type DomainRefEntry = EntryType<'values', { params: { field: fieldRef; pulse: Ref } }>;

// from DataScope.valuesRef
export type ValuesRefEntry = EntryType<
  'values',
  { params: { field: keyFieldRef; pulse: Ref; sort: sortRef } }
>;

// from DataScope.lookupRef, DataScope.indataRef
export type LookupRefEntry = EntryType<'tupleindex', { params: { field: fieldRef; pulse: Ref } }>;

export type OperatorEntry = EntryType<
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
export type DataTransformEntry = EntryType<
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
export type TransformParam =
  // parseIndexParameter
  | Ref
  // parseSubParameters
  | Ref[]
  // parameterValue
  | Parse
  | unknown;

// All entries defined in transforms.js
export type TransformEntry =
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

export type AggregateEntry = EntryType<
  'aggregate',
  {
    params: // DataScope.countsRef
    | ({
          groupby: fieldRef<string, 'key'>;
          pulse: Ref;
        } & (
          | {}
          // DataScope.addSortFIeld
          | {
              ops: ['count', ...(AggregateOp | Ref)[]];
              // Fields can only be string field refs, not signals
              fields: [null, ...fieldRef[]];
              as: ['count', ...string[]];
            }
        ))
      // scale.ordinalMultipleDomain
      | {
          groupby: keyFieldRef;
          pulse: Ref[];
          // DataScope.addSortFIeld
          ops: ['min' | 'max' | 'sum'];
          // Fields can only be string field refs, not signals
          fields: [fieldRef];
          as: [string];
        };
  }
>;
export type AxisTicksEntry = EntryType<'axisticks', { [k: string]: unknown }>;
export type BoundEntry = EntryType<'bound', { [k: string]: unknown }>;
export type CollectEntry = EntryType<'collect', { [k: string]: unknown }>;
export type CompareEntry = EntryType<'compare', { [k: string]: unknown }>;
export type DataJoinEntry = EntryType<'datajoin', { [k: string]: unknown }>;
export type EncodeEntry = EntryType<'encode', { [k: string]: unknown }>;
export type ExpressionEntry = EntryType<'expression', { [k: string]: unknown }>;
export type ExtentEntry = EntryType<'extent', { [k: string]: unknown }>;
export type FacetEntry = EntryType<'facet', { [k: string]: unknown }>;
export type FieldEntry = EntryType<'field', { [k: string]: unknown }>;
export type KeyEntry = EntryType<'key', { [k: string]: unknown }>;
export type LegendEntriesEntry = EntryType<'legendentries', { [k: string]: unknown }>;
export type LoadEntry = EntryType<'load', { [k: string]: unknown }>;
export type MarkEntry = EntryType<'mark', { [k: string]: unknown }>;
export type MultiextentEntry = EntryType<'multiextent', { [k: string]: unknown }>;
export type MultivaluesEntry = EntryType<'multivalues', { [k: string]: unknown }>;
export type OverlapEntry = EntryType<'overlap', { [k: string]: unknown }>;
export type ParamsEntry = EntryType<'params', { [k: string]: unknown }>;
export type PrefacetEntry = EntryType<'prefacet', { [k: string]: unknown }>;
export type ProjectionEntry = EntryType<'projection', { [k: string]: unknown }>;
export type ProxyEntry = EntryType<'proxy', { [k: string]: unknown }>;
export type RelayEntry = EntryType<'relay', { [k: string]: unknown }>;
export type RenderEntry = EntryType<'render', { [k: string]: unknown }>;
export type ScaleEntry = EntryType<'scale', { [k: string]: unknown }>;
export type SieveEntry = EntryType<'sieve', { [k: string]: unknown }>;
export type SortItemsEntry = EntryType<'sortitems', { [k: string]: unknown }>;
export type ViewLayoutEntry = EntryType<'viewlayout', { [k: string]: unknown }>;
export type ValuesEntry = EntryType<'values', { [k: string]: unknown }>;

export type EntryType<NAME extends string, BODY extends { [k: string]: unknown }> = {
  id: id;
  type: NAME;
  // Scope.add
  refs?: null;
  // Scope.finish.annotate
  data?: { [name: string]: ('input' | 'output' | 'values' | `index:${string}`)[] };
} & BODY;

export type Stream = {
  id: id;
  // from parsers/stream.js:streamParameters
  // Currently, only merged or streams that reference another stram
  // use these parameters, but in the vega runtime any stream can have them

  // Filter this stream for events that happen after an event from the first stream
  // and before an event in the second.
  between?: [id, id];
  filter?: Parse['$expr'];
  throttle?: number;
  debounce?: number;
  // Whether to stop native event propogation
  consume?: true;
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
  // in vega-view:events.js any source is supported that is used for
  // querySelectorAll and then the type is used with addEventListener
  // on all results
  | {
      source: string;
      event: string;
    }
  // from parsers/stream.js:eventStream & nestedStream -> streamParameters
  | { stream: id }
  // from parsers/stream.js:mergeStream -> streamParameters
  | { merge: id[] }
);
export interface Update {
  // Using an expression as a target is supported in the vega runtime
  // but not used currently
  target: id | { $expr: Parse['$expr'] };
  source: id | Ref;
  // This is either a primitive, a Parse object, or an object with the keys of parse.
  update: Truthy<Primitive> | Parse | ObjectWithoutKeys<Parse>;
  options?: { force?: boolean };
}

export type Primitive = number | string | bigint | boolean | symbol | undefined | null;
export type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T; // from lodash

export type ObjectWithoutKeys<T extends object> = Record<any, unknown> & Record<keyof T, never>;
export type Binding = {
  signal: string;
} & SpecBinding;

export interface Ref {
  $ref: id;
}

// from `Scope.js:Scope:id`
// String if sub id with `:` seperate parent from child id numbers
export type id = string | number;

// from vega-functions:parser.js
export interface Parse {
  // TODO: AST types
  // TODO: Make ast config as generic param?
  $expr: { code: string; ast?: unknown };
  $params: { [signalName: string]: Ref };
  $fields?: string[];
}

// Scope.sortRef
export type sortRef = Ref | compareRef;

// utils.compareRef
export interface compareRef {
  $compare: string;
  $orders: 'ascending' | 'descending';
}

// utils.fieldRef
export type fieldRef<
  field extends string = string,
  name extends string | undefined = undefined
> = name extends string ? { $field: field; $name: name } : { $field: field };

// utils.keyFieldRef
export type keyFieldRef = fieldRef<'key'>;

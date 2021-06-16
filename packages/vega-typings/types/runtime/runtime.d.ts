import { Config } from 'types/spec';
import { AggregateOp, EventType, WindowEventType, Transforms, Binding as SpecBinding } from '..';
// All references to source code are from the vega-parser package

export interface Runtime {
  description?: string;
  operators: Operator[];
  // Event streams that Vega is listening to. Often DOM events
  streams?: Stream[];
  updates?: Update[];
  bindings: Binding[];
  eventConfig?: Config['events'];
  locale?: Config['locale'];
}

export interface Operator {
  id: id;
  type: string;
  params?: Parameters;
  value?: unknown;
  root?: boolean;
  // Scope.add
  refs?: null;
  signal?: string;
  // Scope.finish.annotate
  data?: { [name: string]: ('input' | 'output' | 'values' | `index:${string}`)[] };
  parent?: OperatorParam;
  scale?: string;
  update?: expr;
  metadata?: { [k: string]: unknown };
  initonly?: boolean;
}

// From vega-runtime/parameters.js
interface Parameters {
  [name: string]: Parameter | Parameter[];
}
// A parameter is either builtin, with the proper keys, or some primitive value or other object
type Parameter =
  | OrOtherObject<
      | OperatorParam
      | KeyParam
      | ExpressionParam
      | FieldParam
      | EncodeParam
      | CompareParam
      | ContextParam
      | SubflowParam
    >
  | Primitive;

type OrOtherObject<T extends object> = T | ObjectWithoutKeys<T>;
/**
 * Resolve an operator reference.
 */
interface OperatorParam {
  $ref: id;
}

/**
 * Resolve a key accessor reference.
 */
interface KeyParam {
  $key: string[];
  $flat?: boolean;
}

/**
 * Resolve an expression reference.
 */
interface ExpressionParam {
  // TODO: AST types
  $expr: { code: string; ast?: unknown };
  $params?: Parameters;
  $fields?: string[];
}

type expr = ExpressionParam['$expr'];

/**
 * Resolve a field accessor reference.
 */
interface FieldParam {
  $field: string;
  $name?: string;
}

/**
 * Resolve an encode operator reference.
 */
interface EncodeParam {
  $encode: {
    [name: string]: {
      $fields: string[];
      $ouput: string[];
      $expr: { marktype: string; channels: { [name: string]: expr } };
    };
  };
}

/**
 * Resolve a comparator function reference.
 */
interface CompareParam {
  // Fields to compare on
  $compare: string | string[];
  $orders: 'ascending' | 'descending';
}

/**
 * Resolve a context reference.
 */
interface ContextParam {
  $context: true;
}

/**
 * Resolve a recursive subflow specification.
 */
interface SubflowParam {
  $subflow: Runtime;
}

// // These are called entries instead of operators because the JS class
// // is also called Entry, defined in util.js:entry
// export type Entry = OperatorEntry | TransformEntry | DataTransformEntry | CacheEntry;

// // from DataScope.cache
// export type CacheEntry = ExtentRefEntry | DomainRefEntry | ValuesRefEntry | LookupRefEntry;

// // from DataScope.extentRef
// export type ExtentRefEntry = EntryType<'extent', { params: { field: fieldRef; pulse: Ref } }>;

// // from DataScope.domainRef
// export type DomainRefEntry = EntryType<'values', { params: { field: fieldRef; pulse: Ref } }>;

// // from DataScope.valuesRef
// export type ValuesRefEntry = EntryType<
//   'values',
//   { params: { field: keyFieldRef; pulse: Ref; sort: sortRef } }
// >;

// // from DataScope.lookupRef, DataScope.indataRef
// export type LookupRefEntry = EntryType<'tupleindex', { params: { field: fieldRef; pulse: Ref } }>;

// export type OperatorEntry = EntryType<
//   'operator',
//   | {
//       // Adding root property in Scope.finish()
//       // Adding root operator node in view.parseView
//       root: true;
//     }
//   | ({
//       // operators added by Scope.addSignal
//       value?: unknown;
//       // added in parsers/signal.js
//       react?: false;
//       // Scope.finish (signals that are removed dont have a name)
//       signal?: string;
//     } & (
//       | {}
//       // Saved to scope.signals in Scope.addSignal
//       // retrieved and modified in parsers/signal-updates.js
//       | {
//           initonly?: true;
//           update: Parse['$expr'];
//           params: Parse['$params'];
//         }
//     ))
// >;

// // The parameters for all builtin vega data transforms
// // from the parsers/transform.js function
// // Possible todo: create per transform type definitions based on transform definitions
// export type DataTransformEntry = EntryType<
//   // TODO: Do we allow external transforms as well?
//   // The current vega spec definition does not.
//   Transforms['type'],
//   {
//     value: null;
//     params: {
//       [name: string]: TransformParam;
//     };
//     // Copies metadata from transform definition
//     // This is not used at runtime.
//     metadata: { [k: string]: unknown };
//   }
// >;

// // // parsers.transform.js:parseParameter
// export type TransformParam =
//   // parseIndexParameter
//   | Ref
//   // parseSubParameters
//   | Ref[]
//   // parameterValue
//   | Parse
//   | unknown;

// // All entries defined in transforms.js
// export type TransformEntry =
//   | AggregateEntry
//   | AxisTicksEntry
//   | BoundEntry
//   | CollectEntry
//   | CompareEntry
//   | DataJoinEntry
//   | EncodeEntry
//   | ExpressionEntry
//   | ExtentEntry
//   | FacetEntry
//   | FieldEntry
//   | KeyEntry
//   | LegendEntriesEntry
//   | LoadEntry
//   | MarkEntry
//   | MultiextentEntry
//   | MultivaluesEntry
//   | OverlapEntry
//   | ParamsEntry
//   | PrefacetEntry
//   | ProjectionEntry
//   | ProxyEntry
//   | RelayEntry
//   | RenderEntry
//   | ScaleEntry
//   | SieveEntry
//   | SortItemsEntry
//   | ViewLayoutEntry
//   | ValuesEntry;

// export type AggregateEntry = EntryType<
//   'aggregate',
//   {
//     params: // DataScope.countsRef
//     | ({
//           groupby: fieldRef<string, 'key'>;
//           pulse: Ref;
//         } & (
//           | {}
//           // DataScope.addSortFIeld
//           | {
//               ops: ['count', ...(AggregateOp | Ref)[]];
//               // Fields can only be string field refs, not signals
//               fields: [null, ...fieldRef[]];
//               as: ['count', ...string[]];
//             }
//         ))
//       // scale.ordinalMultipleDomain
//       | {
//           groupby: keyFieldRef;
//           pulse: Ref[];
//           // DataScope.addSortFIeld
//           ops: ['min' | 'max' | 'sum'];
//           // Fields can only be string field refs, not signals
//           fields: [fieldRef];
//           as: [string];
//         };
//   }
// >;
// export type AxisTicksEntry = EntryType<'axisticks', { [k: string]: unknown }>;
// export type BoundEntry = EntryType<'bound', { [k: string]: unknown }>;
// export type CollectEntry = EntryType<'collect', { [k: string]: unknown }>;
// export type CompareEntry = EntryType<'compare', { [k: string]: unknown }>;
// export type DataJoinEntry = EntryType<'datajoin', { [k: string]: unknown }>;
// export type EncodeEntry = EntryType<'encode', { [k: string]: unknown }>;
// export type ExpressionEntry = EntryType<'expression', { [k: string]: unknown }>;
// export type ExtentEntry = EntryType<'extent', { [k: string]: unknown }>;
// export type FacetEntry = EntryType<'facet', { [k: string]: unknown }>;
// export type FieldEntry = EntryType<'field', { [k: string]: unknown }>;
// export type KeyEntry = EntryType<'key', { [k: string]: unknown }>;
// export type LegendEntriesEntry = EntryType<'legendentries', { [k: string]: unknown }>;
// export type LoadEntry = EntryType<'load', { [k: string]: unknown }>;
// export type MarkEntry = EntryType<'mark', { [k: string]: unknown }>;
// export type MultiextentEntry = EntryType<'multiextent', { [k: string]: unknown }>;
// export type MultivaluesEntry = EntryType<'multivalues', { [k: string]: unknown }>;
// export type OverlapEntry = EntryType<'overlap', { [k: string]: unknown }>;
// export type ParamsEntry = EntryType<'params', { [k: string]: unknown }>;
// export type PrefacetEntry = EntryType<'prefacet', { [k: string]: unknown }>;
// export type ProjectionEntry = EntryType<'projection', { [k: string]: unknown }>;
// export type ProxyEntry = EntryType<'proxy', { [k: string]: unknown }>;
// export type RelayEntry = EntryType<'relay', { [k: string]: unknown }>;
// export type RenderEntry = EntryType<'render', { [k: string]: unknown }>;
// export type ScaleEntry = EntryType<'scale', { [k: string]: unknown }>;
// export type SieveEntry = EntryType<'sieve', { [k: string]: unknown }>;
// export type SortItemsEntry = EntryType<'sortitems', { [k: string]: unknown }>;
// export type ViewLayoutEntry = EntryType<'viewlayout', { [k: string]: unknown }>;
// export type ValuesEntry = EntryType<'values', { [k: string]: unknown }>;

// export type EntryType<NAME extends string, BODY extends { [k: string]: unknown }> = {
//   id: id;
//   type: NAME;
//   // Scope.add
//   refs?: null;
//   // Scope.finish.annotate
//   data?: { [name: string]: ('input' | 'output' | 'values' | `index:${string}`)[] };
// } & BODY;

/**
 * A stream is some type of external input. They are created from Vega
 * EventStreams from signals.
 * */
export type Stream = {
  id: id;
  // from parsers/stream.js:streamParameters
  // Currently, only merged or streams that reference another stram
  // use these parameters, but in the vega runtime any stream can have them

  // Filter this stream for events that happen after an event from the first stream
  // and before an event in the second.
  between?: [id, id];
  filter?: expr;
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

// Updates are added in parsers/update.js -> scope.addUpdate
// which is called from parsers/signal-updates.js for each "on" on each signal
export interface Update {
  // The target signal is set to the new value
  // Using an expression as a target is supported in the vega runtime
  // but not used currently in any examples, so we don't include it in the typings
  target: id;
  // Whenever the source signal fires, the update is triggered
  source: id | Ref;
  // The update either a static value or a parse expxression that
  // is re-evaluted whenever the source fires, and returns the value
  // fpr the target
  // The update is either a static value or a Parse expression.
  update: Primitive | OrOtherObject<ExpressionParam>;
  // If force is true, then it will always update the target,
  // even if the result is the same
  options?: { force?: boolean };
}

export type Primitive = number | string | bigint | boolean | symbol | null;

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

// Scope.sortRef
// export type sortRef = Ref | compareRef;

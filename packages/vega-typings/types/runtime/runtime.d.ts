import { Config, Format } from 'types/spec';
import { AggregateOp, EventType, WindowEventType, Transforms, Binding as SpecBinding } from '..';
// All references to source code are from the vega-parser package

export interface Runtime {
  description?: string;
  operators: Operator[];
  // Event streams that Vega is listening to. Often DOM events.
  streams?: Stream[];
  // Triggers updates of operations based on other operations
  updates?: Update[];
  // Contains a list of bindings which map singal names to DOM input elements.
  // When the dom elements are updated, it updates the operator with the signal name
  // the same as the binding
  bindings: Binding[];
  eventConfig?: Config['events'];
  locale?: Config['locale'];
}

export interface BaseOperator {
  id: id;
  type: string;
  // Parameters that are passed into the transform when it is updated.
  // They can either be static values or references to other operators
  params?: Parameters;
  // The initial value
  value?: unknown;
  root?: boolean;

  // Shows up from Scope.add but isn't used in the runtime
  refs?: null;

  // The name of the signal to bind this to, when the signal is updated, this operator's
  // value is set to the new value
  signal?: string;
  // Scope.finish.annotate
  data?: { [name: string]: ('input' | 'output' | 'values' | `index:${string}`)[] };
  // A parent reference to watch for changes
  parent?: OperatorParam;
  scale?: string;
  metadata?: { [k: string]: unknown };
  initonly?: boolean;
}
export type Operator = DefinedOperator | OtherOperator;
export type DefinedOperator = OperatorOperator | CollectOperator;

export interface OperatorOperator extends BaseOperator {
  type: 'operator';
  update?: expr;
}

export interface CollectOperator extends BaseOperator {
  type: 'collect';
  // Either the data literals, or a reference to data to parse and load
  value?: ObjectOrAny<
    {
      // format of data
      $format?: Format;
    } & (
      | {
          // URL to data
          $request: string;
        }
      | {
          // data as string for CSV or TSV, or object, for JSON
          $ingest: unknown;
        }
    )
  >;
}

export interface OtherOperator extends BaseOperator {
  // TODO: Add more granular types for these
  type: Exclude<
    | 'axisticks'
    | 'bound'
    | 'compare'
    | 'datajoin'
    | 'encode'
    | 'expression'
    | 'extent'
    | 'facet'
    | 'field'
    | 'key'
    | 'legendentries'
    | 'load'
    | 'mark'
    | 'multiextent'
    | 'multivalues'
    | 'overlap'
    | 'params'
    | 'prefacet'
    | 'projection'
    | 'proxy'
    | 'relay'
    | 'render'
    | 'scale'
    | 'sieve'
    | 'sortitems'
    | 'tupleindex'
    | 'viewlayout'
    | 'values'
    | Transforms['type'],
    DefinedOperator['type']
  >;
}

// From vega-runtime/parameters.js
export interface Parameters {
  // If pulse is a param, it must be a ref
  pulse?: OperatorParam | OperatorParam[];
  [name: string]: Parameter | Parameter[];
}
// A parameter is either builtin, with the proper keys, or some primitive value or other object
export type Parameter = ObjectOrAny<
  | OperatorParam
  | KeyParam
  | ExpressionParam
  | FieldParam
  | EncodeParam
  | CompareParam
  | ContextParam
  | SubflowParam
>;

/**
 * Resolve an operator reference.
 */
export interface OperatorParam {
  $ref: id;
}

/**
 * Resolve a key accessor reference.
 */
export interface KeyParam {
  $key: string[];
  $flat?: boolean;
}

/**
 * Resolve an expression reference.
 */
export interface ExpressionParam {
  // TODO: AST types
  $expr: { code: string; ast?: unknown };
  $params?: Record<string, OperatorParam>;
  $fields?: string[];
}

export type expr = ExpressionParam['$expr'];

/**
 * Resolve a field accessor reference.
 */
export interface FieldParam {
  $field: string;
  $name?: string;
}

/**
 * Resolve an encode operator reference.
 */
export interface EncodeParam {
  $encode: {
    update?: EncodeValue;
    enter?: EncodeValue;
    exit?: EncodeValue;
  };
}

export interface EncodeValue {
  $fields: string[];
  $output: string[];
  // The keys of the channels is the same as the $output
  $expr: { marktype: string; channels: Record<string, expr> };
}

/**
 * Resolve a comparator function reference.
 */
export interface CompareParam {
  // Fields to compare on
  $compare: string | string[];
  $orders: 'ascending' | 'descending';
}

/**
 * Resolve a context reference.
 */
export interface ContextParam {
  $context: true;
}

/**
 * Resolve a recursive subflow specification.
 */
export interface SubflowParam {
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

/**
 * A stream is some type of external input. They are created from Vega
 * EventStreams from signals.
 */
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
  source: id | OperatorParam;
  // The update either a static value or a parse expxression that
  // is re-evaluted whenever the source fires, and returns the value
  // fpr the target
  // The update is either a static value or a Parse expression.
  update: ObjectOrAny<ExpressionParam>;
  // If force is true, then it will always update the target,
  // even if the result is the same
  options?: { force?: boolean };
}

export type Binding = {
  signal: string;
} & SpecBinding;

/**
 * Returns a type signature that either matches this object, or any other value
 * that doesn't have the same keys.
 *
 * This lets you easily do matching, so that if it has a known key, you know the type of that key
 */
export type ObjectOrAny<T extends object> =
  | T
  | unknown[]
  | (Record<any, unknown> & Record<KeysOfUnion<T>, never>)
  | Primitive;

// https://stackoverflow.com/a/49402091/907060
type KeysOfUnion<T> = T extends T ? keyof T : never;

export type Primitive = number | string | bigint | boolean | symbol | null | undefined;

// from `Scope.js:Scope:id`
// String if sub id with `:` seperate parent from child id numbers
export type id = string | number;

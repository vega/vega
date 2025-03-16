import { Config, Format } from '../spec/index.js';
import { EventType, Binding as SpecBinding, Transforms, WindowEventType } from '../index.js';
// All references to source code are from the vega-parser package

export interface Runtime {
  description: string;
  operators: Operator[];
  /**
   * Event streams vega is listening to, often DOM events.
   */
  streams: Stream[];
  /**
   * Triggers updates of streams/operations based on other nodes.
   */
  updates: Update[];
  /**
   * Contains a list of bindings which map signal names to DOM input elements.
   * When the dom elements are updated, it updates the operator with the signal name
   * the same as the binding
   */
  bindings: Binding[];
  eventConfig?: Config['events'];
  locale?: Config['locale'];
}

export interface BaseOperator {
  id: ID;
  type: string;
  /**
   * Parameters that are passed into the transform when it is updated.
   * They can either be static values or references to other operators
   */
  params?: Parameters;
  /**
   * The initial value
   */
  value?: unknown;
  root?: boolean;

  /**
   * Shows up from Scope.add but isn't used in the runtime
   */
  refs?: null;

  /**
   * The name of the signal to bind this to, when the signal is updated, this operator's
   * value is set to the new value
   */
  signal?: string;
  /**
   * From Scope.finish.annotate
   */
  data?: { [name: string]: ('input' | 'output' | 'values' | `index:${string}`)[] };
  /**
   * A parent reference to watch for changes
   */
  parent?: OperatorParam;
  scale?: string;
  metadata?: { [k: string]: unknown };

  /**
   * A flag indicating if this operator should
   * automatically update (react) when parameter values change. In other words,
   * this flag determines if the operator registers itself as a listener on
   * any upstream operators included in the parameters.
   * Default is true
   */
  react?: boolean;

  /**
   * A flag indicating if this operator
   * should calculate an update only upon its initial evaluation, then
   * deregister dependencies and suppress all future update invocations.
   * Default is false
   */
  initonly?: boolean;
}
export type Operator = DefinedOperator | OtherOperator;

/**
 * We have added special typings for a few operators. Ideally, all built in
 * operators would have precise typings, to correspond to their parameters, but we
 * are typing them gradually.
 */
export type DefinedOperator = OperatorOperator | CollectOperator | AggregateOperator;

export interface OperatorOperator extends BaseOperator {
  type: 'operator';
  update?: expr;
}

export interface CollectOperator extends BaseOperator {
  type: 'collect';
  /**
   * Either the data literals, or a reference to data to parse and load
   */
  value?: ObjectOrAny<
    {
      /**
       * format of data
       */
      $format?: Format;
    } & (
      | {
          /**
           * URL to data
           */
          $request: string;
        }
      | {
          /**
           * data as string for CSV or TSV, or object, for JSON
           */
          $ingest: unknown;
        }
    )
  >;
}

/**
 * Group-by aggregation operator.
 */
export interface AggregateOperator extends BaseOperator {
  type: 'aggregate';
  params: {
    pulse: OrArray<OperatorParam>;
    /**
     * An array of accessors to groupby.
     */
    groupby?: OrArray<AccessorParameters>;
    /**
     * An accessor that should return a string to key by
     * Defaults to concatenating the groupby accessors
     */
    key?: AccessorParameters;
    /**
     * An array of accessors to aggregate
     * Can only be null if the op is count
     */
    fields?: OrArray<AccessorParameters | null>;
    /**
     * An array of strings indicating aggregation operations.
     */
    ops?: OrArray<AggregateOps | OperatorParam>;
    /**
     * An array of output field names for aggregated values.
     */
    as?: OrArray<string | OperatorParam>;
    /**
     * A flag indicating that the full cross-product of groupby values should be
     * generated, including empty cells.
     * If true, the drop parameter is ignored and empty cells are retained.
     * Defaults to false
     */
    cross?: boolean | OperatorParam;
    /**
     * A flag indicating if empty cells should be removed.
     * Defaults to true
     */
    drop?: boolean | OperatorParam;
  };
}

export type OrArray<T> = T | T[];

/**
 * All valid aggregate operators, from vega-transforms utils/AggregateOps.js
 */
export type AggregateOps =
  | 'values'
  | 'count'
  | 'missing'
  | 'valid'
  | 'sum'
  | 'product'
  | 'mean'
  | 'average'
  | 'variance'
  | 'variancep'
  | 'stdev'
  | 'stdevp'
  | 'stderr'
  | 'distinct'
  | 'ci0'
  | 'ci1'
  | 'median'
  | 'q1'
  | 'q3'
  | 'min'
  | 'max'
  | 'argmin'
  | 'argmax';
/**
 * Support other operators which we haven't added as granular types for yet.
 */
export interface OtherOperator extends BaseOperator {
  type: Exclude<
    /**
     * All operator types defined in vega-parser transforms.js
     */
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

/**
 * From vega-runtime/parameters.js
 */
export interface Parameters {
  /**
   * If pulse is a param, it must be a ref
   */
  pulse?: OperatorParam | OperatorParam[];
  [name: string]: Parameter;
}
/**
 * A parameter is either builtin, with the proper keys, or some primitive value or other object
 */
export type Parameter = ObjectOrListObjectOrAny<BuiltinParameter>;

/**
 * Accessor parameters return an accessor function which can be applied to each row of the data.
 */
export type AccessorParameters = KeyParam | ExpressionParam | FieldParam | OperatorParam;

export type BuiltinParameter =
  | OperatorParam
  | KeyParam
  | ExpressionParam
  | FieldParam
  | EncodeParam
  | CompareParam
  | ContextParam
  | SubflowParam;

/**
 * Resolve an operator reference.
 */
export interface OperatorParam {
  $ref: ID;
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
  /**
   * TODO: add support for AST types
   */
  $expr: { code: string; ast?: unknown };
  $params?: Record<string, OperatorParam>;
  $fields?: string[];
}

export type expr = ExpressionParam['$expr'];

/**
 * Resolve a field accessor reference.
 */
export interface FieldParam {
  $field: string | null;
  $name?: string;
}

/**
 * Resolve an encode operator reference.
 */
export interface EncodeParam {
  $encode: Record<string, EncodeValue>;
}

export interface EncodeValue {
  $fields: string[];
  $output: string[];

  /**
   * The keys of the channels are the same as the $output
   */
  $expr: { marktype: string; channels: Record<string, expr> };
}

/**
 * Resolve a comparator function reference.
 */
export interface CompareParam {
  /**
   * Fields to compare on
   */
  $compare: OrArray<string>;
  $order: OrArray<Order>;
}

export type Order = 'ascending' | 'descending';

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
  $subflow: Subflow;
}

export type Subflow = Pick<Runtime, 'operators' | 'streams' | 'updates'>;

/**
 * A stream is some type of external input. They are created from Vega
 * EventStreams from signals.
 */
export type Stream = {
  id: ID;
  /**
   * from parsers/stream.js:streamParameters
   * Currently, only merged or streams that reference another stream use these
   * parameters, but in the vega runtime any stream can have them
   */

  /**
   * Filter this stream for events that happen after an event from the first
   * stream and before an event in the second.
   */
  between?: [ID, ID];
  filter?: expr;
  throttle?: number;
  debounce?: number;
  /**
   * Whether to stop native event propagation
   */
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
  /**
   * from parsers/stream.js:eventStream & nestedStream -> streamParameters
   */
  | { stream: ID }
  /**
   * from parsers/stream.js:mergeStream -> streamParameters
   */
  | { merge: ID[] }
);

/**
 * Updates are added in parsers/update.js -> scope.addUpdate
 * which is called from parsers/signal-updates.js for each "on" on each signal
 */
export interface Update {
  /**
   * The target signal is set to the new value.
   * Using an expression as a target is supported in the vega runtime
   * but not used currently in any examples, so we don't include it in the typings.
   */
  target: ID;
  /**
   * Whenever the source signal fires, the update is triggered
   */
  source: ID | OperatorParam;
  /**
   * The update is  either a static value or a parse expression that is
   * re-evaluated whenever the source fires, and returns the value for the
   * target
   */
  update: ObjectOrAny<ExpressionParam>;
  /**
   * If force is true, then it will always update the target,
   * even if the result is the same
   */
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
  // https://stackoverflow.com/a/52618536/907060
  | (Record<string, unknown> & Partial<Record<KeysOfUnion<T>, never>>)
  | Primitive;

/**
 * Like the above, but if it allows a list, then the list can also be of those objects
 */
export type ObjectOrListObjectOrAny<T extends object> =
  | T
  | ObjectOrAny<T>[]
  | (Record<string, unknown> & Partial<Record<KeysOfUnion<T>, never>>)
  | Primitive;

// https://stackoverflow.com/a/49402091/907060
export type KeysOfUnion<T> = T extends T ? keyof T : never;

export type Primitive = number | string | bigint | boolean | symbol | null | undefined;

/**
 * from `Scope.js:Scope:id`
 * String if sub id with `:` separate parent from child id numbers
 */
export type ID = string | number;

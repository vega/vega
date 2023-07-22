import { identity, array, isFunction, constant, isArray, id, error, truthy, debounce, extend, visitArray, inherits, logger, Error, hasOwnProperty } from 'vega-util';
import { read, responseType, loader } from 'vega-loader';
import { defaultLocale } from 'vega-format';

function UniqueList(idFunc) {
  const $ = idFunc || identity,
    list = [],
    ids = {};
  list.add = _ => {
    const id = $(_);
    if (!ids[id]) {
      ids[id] = 1;
      list.push(_);
    }
    return list;
  };
  list.remove = _ => {
    const id = $(_);
    if (ids[id]) {
      ids[id] = 0;
      const idx = list.indexOf(_);
      if (idx >= 0) list.splice(idx, 1);
    }
    return list;
  };
  return list;
}

/**
 * Invoke and await a potentially async callback function. If
 * an error occurs, trap it and route to Dataflow.error.
 * @param {Dataflow} df - The dataflow instance
 * @param {function} callback - A callback function to invoke
 *   and then await. The dataflow will be passed as the single
 *   argument to the function.
 */
async function asyncCallback (df, callback) {
  try {
    await callback(df);
  } catch (err) {
    df.error(err);
  }
}

const TUPLE_ID_KEY = Symbol('vega_id');
let TUPLE_ID = 1;

/**
 * Checks if an input value is a registered tuple.
 * @param {*} t - The value to check.
 * @return {boolean} True if the input is a tuple, false otherwise.
 */
function isTuple(t) {
  return !!(t && tupleid(t));
}

/**
 * Returns the id of a tuple.
 * @param {object} t - The input tuple.
 * @return {*} the tuple id.
 */
function tupleid(t) {
  return t[TUPLE_ID_KEY];
}

/**
 * Sets the id of a tuple.
 * @param {object} t - The input tuple.
 * @param {*} id - The id value to set.
 * @return {object} the input tuple.
 */
function setid(t, id) {
  t[TUPLE_ID_KEY] = id;
  return t;
}

/**
 * Ingest an object or value as a data tuple.
 * If the input value is an object, an id field will be added to it. For
 * efficiency, the input object is modified directly. A copy is not made.
 * If the input value is a literal, it will be wrapped in a new object
 * instance, with the value accessible as the 'data' property.
 * @param datum - The value to ingest.
 * @return {object} The ingested data tuple.
 */
function ingest$1(datum) {
  const t = datum === Object(datum) ? datum : {
    data: datum
  };
  return tupleid(t) ? t : setid(t, TUPLE_ID++);
}

/**
 * Given a source tuple, return a derived copy.
 * @param {object} t - The source tuple.
 * @return {object} The derived tuple.
 */
function derive(t) {
  return rederive(t, ingest$1({}));
}

/**
 * Rederive a derived tuple by copying values from the source tuple.
 * @param {object} t - The source tuple.
 * @param {object} d - The derived tuple.
 * @return {object} The derived tuple.
 */
function rederive(t, d) {
  for (const k in t) d[k] = t[k];
  return d;
}

/**
 * Replace an existing tuple with a new tuple.
 * @param {object} t - The existing data tuple.
 * @param {object} d - The new tuple that replaces the old.
 * @return {object} The new tuple.
 */
function replace(t, d) {
  return setid(d, tupleid(t));
}

/**
 * Generate an augmented comparator function that provides stable
 * sorting by tuple id when the given comparator produces ties.
 * @param {function} cmp - The comparator to augment.
 * @param {function} [f] - Optional tuple accessor function.
 * @return {function} An augmented comparator function.
 */
function stableCompare(cmp, f) {
  return !cmp ? null : f ? (a, b) => cmp(a, b) || tupleid(f(a)) - tupleid(f(b)) : (a, b) => cmp(a, b) || tupleid(a) - tupleid(b);
}

function isChangeSet(v) {
  return v && v.constructor === changeset;
}
function changeset() {
  const add = [],
    // insert tuples
    rem = [],
    // remove tuples
    mod = [],
    // modify tuples
    remp = [],
    // remove by predicate
    modp = []; // modify by predicate
  let clean = null,
    reflow = false;
  return {
    constructor: changeset,
    insert(t) {
      const d = array(t),
        n = d.length;
      for (let i = 0; i < n; ++i) add.push(d[i]);
      return this;
    },
    remove(t) {
      const a = isFunction(t) ? remp : rem,
        d = array(t),
        n = d.length;
      for (let i = 0; i < n; ++i) a.push(d[i]);
      return this;
    },
    modify(t, field, value) {
      const m = {
        field: field,
        value: constant(value)
      };
      if (isFunction(t)) {
        m.filter = t;
        modp.push(m);
      } else {
        m.tuple = t;
        mod.push(m);
      }
      return this;
    },
    encode(t, set) {
      if (isFunction(t)) modp.push({
        filter: t,
        field: set
      });else mod.push({
        tuple: t,
        field: set
      });
      return this;
    },
    clean(value) {
      clean = value;
      return this;
    },
    reflow() {
      reflow = true;
      return this;
    },
    pulse(pulse, tuples) {
      const cur = {},
        out = {};
      let i, n, m, f, t, id;

      // build lookup table of current tuples
      for (i = 0, n = tuples.length; i < n; ++i) {
        cur[tupleid(tuples[i])] = 1;
      }

      // process individual tuples to remove
      for (i = 0, n = rem.length; i < n; ++i) {
        t = rem[i];
        cur[tupleid(t)] = -1;
      }

      // process predicate-based removals
      for (i = 0, n = remp.length; i < n; ++i) {
        f = remp[i];
        tuples.forEach(t => {
          if (f(t)) cur[tupleid(t)] = -1;
        });
      }

      // process all add tuples
      for (i = 0, n = add.length; i < n; ++i) {
        t = add[i];
        id = tupleid(t);
        if (cur[id]) {
          // tuple already resides in dataset
          // if flagged for both add and remove, cancel
          cur[id] = 1;
        } else {
          // tuple does not reside in dataset, add
          pulse.add.push(ingest$1(add[i]));
        }
      }

      // populate pulse rem list
      for (i = 0, n = tuples.length; i < n; ++i) {
        t = tuples[i];
        if (cur[tupleid(t)] < 0) pulse.rem.push(t);
      }

      // modify helper method
      function modify(t, f, v) {
        if (v) {
          t[f] = v(t);
        } else {
          pulse.encode = f;
        }
        if (!reflow) out[tupleid(t)] = t;
      }

      // process individual tuples to modify
      for (i = 0, n = mod.length; i < n; ++i) {
        m = mod[i];
        t = m.tuple;
        f = m.field;
        id = cur[tupleid(t)];
        if (id > 0) {
          modify(t, f, m.value);
          pulse.modifies(f);
        }
      }

      // process predicate-based modifications
      for (i = 0, n = modp.length; i < n; ++i) {
        m = modp[i];
        f = m.filter;
        tuples.forEach(t => {
          if (f(t) && cur[tupleid(t)] > 0) {
            modify(t, m.field, m.value);
          }
        });
        pulse.modifies(m.field);
      }

      // upon reflow request, populate mod with all non-removed tuples
      // otherwise, populate mod with modified tuples only
      if (reflow) {
        pulse.mod = rem.length || remp.length ? tuples.filter(t => cur[tupleid(t)] > 0) : tuples.slice();
      } else {
        for (id in out) pulse.mod.push(out[id]);
      }

      // set pulse garbage collection request
      if (clean || clean == null && (rem.length || remp.length)) {
        pulse.clean(true);
      }
      return pulse;
    }
  };
}

const CACHE = '_:mod:_';

/**
 * Hash that tracks modifications to assigned values.
 * Callers *must* use the set method to update values.
 */
function Parameters() {
  Object.defineProperty(this, CACHE, {
    writable: true,
    value: {}
  });
}
Parameters.prototype = {
  /**
   * Set a parameter value. If the parameter value changes, the parameter
   * will be recorded as modified.
   * @param {string} name - The parameter name.
   * @param {number} index - The index into an array-value parameter. Ignored if
   *   the argument is undefined, null or less than zero.
   * @param {*} value - The parameter value to set.
   * @param {boolean} [force=false] - If true, records the parameter as modified
   *   even if the value is unchanged.
   * @return {Parameters} - This parameter object.
   */
  set(name, index, value, force) {
    const o = this,
      v = o[name],
      mod = o[CACHE];
    if (index != null && index >= 0) {
      if (v[index] !== value || force) {
        v[index] = value;
        mod[index + ':' + name] = -1;
        mod[name] = -1;
      }
    } else if (v !== value || force) {
      o[name] = value;
      mod[name] = isArray(value) ? 1 + value.length : -1;
    }
    return o;
  },
  /**
   * Tests if one or more parameters has been modified. If invoked with no
   * arguments, returns true if any parameter value has changed. If the first
   * argument is array, returns trues if any parameter name in the array has
   * changed. Otherwise, tests if the given name and optional array index has
   * changed.
   * @param {string} name - The parameter name to test.
   * @param {number} [index=undefined] - The parameter array index to test.
   * @return {boolean} - Returns true if a queried parameter was modified.
   */
  modified(name, index) {
    const mod = this[CACHE];
    if (!arguments.length) {
      for (const k in mod) {
        if (mod[k]) return true;
      }
      return false;
    } else if (isArray(name)) {
      for (let k = 0; k < name.length; ++k) {
        if (mod[name[k]]) return true;
      }
      return false;
    }
    return index != null && index >= 0 ? index + 1 < mod[name] || !!mod[index + ':' + name] : !!mod[name];
  },
  /**
   * Clears the modification records. After calling this method,
   * all parameters are considered unmodified.
   */
  clear() {
    this[CACHE] = {};
    return this;
  }
};

let OP_ID = 0;
const PULSE = 'pulse',
  NO_PARAMS = new Parameters();

// Boolean Flags
const SKIP$1 = 1,
  MODIFIED = 2;

/**
 * An Operator is a processing node in a dataflow graph.
 * Each operator stores a value and an optional value update function.
 * Operators can accept a hash of named parameters. Parameter values can
 * either be direct (JavaScript literals, arrays, objects) or indirect
 * (other operators whose values will be pulled dynamically). Operators
 * included as parameters will have this operator added as a dependency.
 * @constructor
 * @param {*} [init] - The initial value for this operator.
 * @param {function(object, Pulse)} [update] - An update function. Upon
 *   evaluation of this operator, the update function will be invoked and the
 *   return value will be used as the new value of this operator.
 * @param {object} [params] - The parameters for this operator.
 * @param {boolean} [react=true] - Flag indicating if this operator should
 *   listen for changes to upstream operators included as parameters.
 * @see parameters
 */
function Operator(init, update, params, react) {
  this.id = ++OP_ID;
  this.value = init;
  this.stamp = -1;
  this.rank = -1;
  this.qrank = -1;
  this.flags = 0;
  if (update) {
    this._update = update;
  }
  if (params) this.parameters(params, react);
}
function flag(bit) {
  return function (state) {
    const f = this.flags;
    if (arguments.length === 0) return !!(f & bit);
    this.flags = state ? f | bit : f & ~bit;
    return this;
  };
}
Operator.prototype = {
  /**
   * Returns a list of target operators dependent on this operator.
   * If this list does not exist, it is created and then returned.
   * @return {UniqueList}
   */
  targets() {
    return this._targets || (this._targets = UniqueList(id));
  },
  /**
   * Sets the value of this operator.
   * @param {*} value - the value to set.
   * @return {Number} Returns 1 if the operator value has changed
   *   according to strict equality, returns 0 otherwise.
   */
  set(value) {
    if (this.value !== value) {
      this.value = value;
      return 1;
    } else {
      return 0;
    }
  },
  /**
   * Indicates that operator evaluation should be skipped on the next pulse.
   * This operator will still propagate incoming pulses, but its update function
   * will not be invoked. The skip flag is reset after every pulse, so calling
   * this method will affect processing of the next pulse only.
   */
  skip: flag(SKIP$1),
  /**
   * Indicates that this operator's value has been modified on its most recent
   * pulse. Normally modification is checked via strict equality; however, in
   * some cases it is more efficient to update the internal state of an object.
   * In those cases, the modified flag can be used to trigger propagation. Once
   * set, the modification flag persists across pulses until unset. The flag can
   * be used with the last timestamp to test if a modification is recent.
   */
  modified: flag(MODIFIED),
  /**
   * Sets the parameters for this operator. The parameter values are analyzed for
   * operator instances. If found, this operator will be added as a dependency
   * of the parameterizing operator. Operator values are dynamically marshalled
   * from each operator parameter prior to evaluation. If a parameter value is
   * an array, the array will also be searched for Operator instances. However,
   * the search does not recurse into sub-arrays or object properties.
   * @param {object} params - A hash of operator parameters.
   * @param {boolean} [react=true] - A flag indicating if this operator should
   *   automatically update (react) when parameter values change. In other words,
   *   this flag determines if the operator registers itself as a listener on
   *   any upstream operators included in the parameters.
   * @param {boolean} [initonly=false] - A flag indicating if this operator
   *   should calculate an update only upon its initial evaluation, then
   *   deregister dependencies and suppress all future update invocations.
   * @return {Operator[]} - An array of upstream dependencies.
   */
  parameters(params, react, initonly) {
    react = react !== false;
    const argval = this._argval = this._argval || new Parameters(),
      argops = this._argops = this._argops || [],
      deps = [];
    let name, value, n, i;
    const add = (name, index, value) => {
      if (value instanceof Operator) {
        if (value !== this) {
          if (react) value.targets().add(this);
          deps.push(value);
        }
        argops.push({
          op: value,
          name: name,
          index: index
        });
      } else {
        argval.set(name, index, value);
      }
    };
    for (name in params) {
      value = params[name];
      if (name === PULSE) {
        array(value).forEach(op => {
          if (!(op instanceof Operator)) {
            error('Pulse parameters must be operator instances.');
          } else if (op !== this) {
            op.targets().add(this);
            deps.push(op);
          }
        });
        this.source = value;
      } else if (isArray(value)) {
        argval.set(name, -1, Array(n = value.length));
        for (i = 0; i < n; ++i) add(name, i, value[i]);
      } else {
        add(name, -1, value);
      }
    }
    this.marshall().clear(); // initialize values
    if (initonly) argops.initonly = true;
    return deps;
  },
  /**
   * Internal method for marshalling parameter values.
   * Visits each operator dependency to pull the latest value.
   * @return {Parameters} A Parameters object to pass to the update function.
   */
  marshall(stamp) {
    const argval = this._argval || NO_PARAMS,
      argops = this._argops;
    let item, i, op, mod;
    if (argops) {
      const n = argops.length;
      for (i = 0; i < n; ++i) {
        item = argops[i];
        op = item.op;
        mod = op.modified() && op.stamp === stamp;
        argval.set(item.name, item.index, op.value, mod);
      }
      if (argops.initonly) {
        for (i = 0; i < n; ++i) {
          item = argops[i];
          item.op.targets().remove(this);
        }
        this._argops = null;
        this._update = null;
      }
    }
    return argval;
  },
  /**
   * Detach this operator from the dataflow.
   * Unregisters listeners on upstream dependencies.
   */
  detach() {
    const argops = this._argops;
    let i, n, item, op;
    if (argops) {
      for (i = 0, n = argops.length; i < n; ++i) {
        item = argops[i];
        op = item.op;
        if (op._targets) {
          op._targets.remove(this);
        }
      }
    }

    // remove references to the source and pulse object,
    // if present, to prevent memory leaks of old data.
    this.pulse = null;
    this.source = null;
  },
  /**
   * Delegate method to perform operator processing.
   * Subclasses can override this method to perform custom processing.
   * By default, it marshalls parameters and calls the update function
   * if that function is defined. If the update function does not
   * change the operator value then StopPropagation is returned.
   * If no update function is defined, this method does nothing.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return The output pulse or StopPropagation. A falsy return value
   *   (including undefined) will let the input pulse pass through.
   */
  evaluate(pulse) {
    const update = this._update;
    if (update) {
      const params = this.marshall(pulse.stamp),
        v = update.call(this, params, pulse);
      params.clear();
      if (v !== this.value) {
        this.value = v;
      } else if (!this.modified()) {
        return pulse.StopPropagation;
      }
    }
  },
  /**
   * Run this operator for the current pulse. If this operator has already
   * been run at (or after) the pulse timestamp, returns StopPropagation.
   * Internally, this method calls {@link evaluate} to perform processing.
   * If {@link evaluate} returns a falsy value, the input pulse is returned.
   * This method should NOT be overridden, instead overrride {@link evaluate}.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return the output pulse for this operator (or StopPropagation)
   */
  run(pulse) {
    if (pulse.stamp < this.stamp) return pulse.StopPropagation;
    let rv;
    if (this.skip()) {
      this.skip(false);
      rv = 0;
    } else {
      rv = this.evaluate(pulse);
    }
    return this.pulse = rv || pulse;
  }
};

/**
 * Add an operator to the dataflow graph. This function accepts a
 * variety of input argument types. The basic signature supports an
 * initial value, update function and parameters. If the first parameter
 * is an Operator instance, it will be added directly. If it is a
 * constructor for an Operator subclass, a new instance will be instantiated.
 * Otherwise, if the first parameter is a function instance, it will be used
 * as the update function and a null initial value is assumed.
 * @param {*} init - One of: the operator to add, the initial value of
 *   the operator, an operator class to instantiate, or an update function.
 * @param {function} [update] - The operator update function.
 * @param {object} [params] - The operator parameters.
 * @param {boolean} [react=true] - Flag indicating if this operator should
 *   listen for changes to upstream operators included as parameters.
 * @return {Operator} - The added operator.
 */
function add (init, update, params, react) {
  let shift = 1,
    op;
  if (init instanceof Operator) {
    op = init;
  } else if (init && init.prototype instanceof Operator) {
    op = new init();
  } else if (isFunction(init)) {
    op = new Operator(null, init);
  } else {
    shift = 0;
    op = new Operator(init, update);
  }
  this.rank(op);
  if (shift) {
    react = params;
    params = update;
  }
  if (params) this.connect(op, op.parameters(params, react));
  this.touch(op);
  return op;
}

/**
 * Connect a target operator as a dependent of source operators.
 * If necessary, this method will rerank the target operator and its
 * dependents to ensure propagation proceeds in a topologically sorted order.
 * @param {Operator} target - The target operator.
 * @param {Array<Operator>} - The source operators that should propagate
 *   to the target operator.
 */
function connect (target, sources) {
  const targetRank = target.rank,
    n = sources.length;
  for (let i = 0; i < n; ++i) {
    if (targetRank < sources[i].rank) {
      this.rerank(target);
      return;
    }
  }
}

let STREAM_ID = 0;

/**
 * Models an event stream.
 * @constructor
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @param {function(Object)} [receive] - Event callback function to invoke
 *   upon receipt of a new event. Use to override standard event processing.
 */
function EventStream(filter, apply, receive) {
  this.id = ++STREAM_ID;
  this.value = null;
  if (receive) this.receive = receive;
  if (filter) this._filter = filter;
  if (apply) this._apply = apply;
}

/**
 * Creates a new event stream instance with the provided
 * (optional) filter, apply and receive functions.
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @see EventStream
 */
function stream(filter, apply, receive) {
  return new EventStream(filter, apply, receive);
}
EventStream.prototype = {
  _filter: truthy,
  _apply: identity,
  targets() {
    return this._targets || (this._targets = UniqueList(id));
  },
  consume(_) {
    if (!arguments.length) return !!this._consume;
    this._consume = !!_;
    return this;
  },
  receive(evt) {
    if (this._filter(evt)) {
      const val = this.value = this._apply(evt),
        trg = this._targets,
        n = trg ? trg.length : 0;
      for (let i = 0; i < n; ++i) trg[i].receive(val);
      if (this._consume) {
        evt.preventDefault();
        evt.stopPropagation();
      }
    }
  },
  filter(filter) {
    const s = stream(filter);
    this.targets().add(s);
    return s;
  },
  apply(apply) {
    const s = stream(null, apply);
    this.targets().add(s);
    return s;
  },
  merge() {
    const s = stream();
    this.targets().add(s);
    for (let i = 0, n = arguments.length; i < n; ++i) {
      arguments[i].targets().add(s);
    }
    return s;
  },
  throttle(pause) {
    let t = -1;
    return this.filter(() => {
      const now = Date.now();
      if (now - t > pause) {
        t = now;
        return 1;
      } else {
        return 0;
      }
    });
  },
  debounce(delay) {
    const s = stream();
    this.targets().add(stream(null, null, debounce(delay, e => {
      const df = e.dataflow;
      s.receive(e);
      if (df && df.run) df.run();
    })));
    return s;
  },
  between(a, b) {
    let active = false;
    a.targets().add(stream(null, null, () => active = true));
    b.targets().add(stream(null, null, () => active = false));
    return this.filter(() => active);
  },
  detach() {
    // ensures compatibility with operators (#2753)
    // remove references to other streams and filter functions that may
    // be bound to subcontexts that need to be garbage collected.
    this._filter = truthy;
    this._targets = null;
  }
};

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor. The input must
 *  support the addEventListener method.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @param {function(object): *} [apply] - Event application function.
 *   If provided, this function will be invoked and the result will be
 *   used as the downstream event value.
 * @return {EventStream}
 */
function events (source, type, filter, apply) {
  const df = this,
    s = stream(filter, apply),
    send = function (e) {
      e.dataflow = df;
      try {
        s.receive(e);
      } catch (error) {
        df.error(error);
      } finally {
        df.run();
      }
    };
  let sources;
  if (typeof source === 'string' && typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  } else {
    sources = array(source);
  }
  const n = sources.length;
  for (let i = 0; i < n; ++i) {
    sources[i].addEventListener(type, send);
  }
  return s;
}

function parse(data, format) {
  const locale = this.locale();
  return read(data, format, locale.timeParse, locale.utcParse);
}

/**
 * Ingests new data into the dataflow. First parses the data using the
 * vega-loader read method, then pulses a changeset to the target operator.
 * @param {Operator} target - The Operator to target with ingested data,
 *   typically a Collect transform instance.
 * @param {*} data - The input data, prior to parsing. For JSON this may
 *   be a string or an object. For CSV, TSV, etc should be a string.
 * @param {object} format - The data format description for parsing
 *   loaded data. This object is passed to the vega-loader read method.
 * @returns {Dataflow}
 */
function ingest(target, data, format) {
  data = this.parse(data, format);
  return this.pulse(target, this.changeset().insert(data));
}

/**
 * Request data from an external source, parse it, and return a Promise.
 * @param {string} url - The URL from which to load the data. This string
 *   is passed to the vega-loader load method.
 * @param {object} [format] - The data format description for parsing
 *   loaded data. This object is passed to the vega-loader read method.
 * @return {Promise} A Promise that resolves upon completion of the request.
 *   The resolved object contains the following properties:
 *   - data: an array of parsed data (or null upon error)
 *   - status: a code for success (0), load fail (-1), or parse fail (-2)
 */
async function request(url, format) {
  const df = this;
  let status = 0,
    data;
  try {
    data = await df.loader().load(url, {
      context: 'dataflow',
      response: responseType(format && format.type)
    });
    try {
      data = df.parse(data, format);
    } catch (err) {
      status = -2;
      df.warn('Data ingestion failed', url, err);
    }
  } catch (err) {
    status = -1;
    df.warn('Loading failed', url, err);
  }
  return {
    data,
    status
  };
}
async function preload(target, url, format) {
  const df = this,
    pending = df._pending || loadPending(df);
  pending.requests += 1;
  const res = await df.request(url, format);
  df.pulse(target, df.changeset().remove(truthy).insert(res.data || []));
  pending.done();
  return res;
}
function loadPending(df) {
  let accept;
  const pending = new Promise(a => accept = a);
  pending.requests = 0;
  pending.done = () => {
    if (--pending.requests === 0) {
      df._pending = null;
      accept(df);
    }
  };
  return df._pending = pending;
}

const SKIP = {
  skip: true
};

/**
 * Perform operator updates in response to events. Applies an
 * update function to compute a new operator value. If the update function
 * returns a {@link ChangeSet}, the operator will be pulsed with those tuple
 * changes. Otherwise, the operator value will be updated to the return value.
 * @param {EventStream|Operator} source - The event source to react to.
 *   This argument can be either an EventStream or an Operator.
 * @param {Operator|function(object):Operator} target - The operator to update.
 *   This argument can either be an Operator instance or (if the source
 *   argument is an EventStream), a function that accepts an event object as
 *   input and returns an Operator to target.
 * @param {function(Parameters,Event): *} [update] - Optional update function
 *   to compute the new operator value, or a literal value to set. Update
 *   functions expect to receive a parameter object and event as arguments.
 *   This function can either return a new operator value or (if the source
 *   argument is an EventStream) a {@link ChangeSet} instance to pulse
 *   the target operator with tuple changes.
 * @param {object} [params] - The update function parameters.
 * @param {object} [options] - Additional options hash. If not overridden,
 *   updated operators will be skipped by default.
 * @param {boolean} [options.skip] - If true, the operator will
 *  be skipped: it will not be evaluated, but its dependents will be.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @return {Dataflow}
 */
function on (source, target, update, params, options) {
  const fn = source instanceof Operator ? onOperator : onStream;
  fn(this, source, target, update, params, options);
  return this;
}
function onStream(df, stream, target, update, params, options) {
  const opt = extend({}, options, SKIP);
  let func, op;
  if (!isFunction(target)) target = constant(target);
  if (update === undefined) {
    func = e => df.touch(target(e));
  } else if (isFunction(update)) {
    op = new Operator(null, update, params, false);
    func = e => {
      op.evaluate(e);
      const t = target(e),
        v = op.value;
      isChangeSet(v) ? df.pulse(t, v, options) : df.update(t, v, opt);
    };
  } else {
    func = e => df.update(target(e), update, opt);
  }
  stream.apply(func);
}
function onOperator(df, source, target, update, params, options) {
  if (update === undefined) {
    source.targets().add(target);
  } else {
    const opt = options || {},
      op = new Operator(null, updater(target, update), params, false);
    op.modified(opt.force);
    op.rank = source.rank; // immediately follow source
    source.targets().add(op); // add dependency

    if (target) {
      op.skip(true); // skip first invocation
      op.value = target.value; // initialize value
      op.targets().add(target); // chain dependencies
      df.connect(target, [op]); // rerank as needed, #1672
    }
  }
}

function updater(target, update) {
  update = isFunction(update) ? update : constant(update);
  return target ? function (_, pulse) {
    const value = update(_, pulse);
    if (!target.skip()) {
      target.skip(value !== this.value).value = value;
    }
    return value;
  } : update;
}

/**
 * Assigns a rank to an operator. Ranks are assigned in increasing order
 * by incrementing an internal rank counter.
 * @param {Operator} op - The operator to assign a rank.
 */
function rank(op) {
  op.rank = ++this._rank;
}

/**
 * Re-ranks an operator and all downstream target dependencies. This
 * is necessary when upstream dependencies of higher rank are added to
 * a target operator.
 * @param {Operator} op - The operator to re-rank.
 */
function rerank(op) {
  const queue = [op];
  let cur, list, i;
  while (queue.length) {
    this.rank(cur = queue.pop());
    if (list = cur._targets) {
      for (i = list.length; --i >= 0;) {
        queue.push(cur = list[i]);
        if (cur === op) error('Cycle detected in dataflow graph.');
      }
    }
  }
}

/**
 * Sentinel value indicating pulse propagation should stop.
 */
const StopPropagation = {};

// Pulse visit type flags
const ADD = 1 << 0,
  REM = 1 << 1,
  MOD = 1 << 2,
  ADD_REM = ADD | REM,
  ADD_MOD = ADD | MOD,
  ALL = ADD | REM | MOD,
  REFLOW = 1 << 3,
  SOURCE = 1 << 4,
  NO_SOURCE = 1 << 5,
  NO_FIELDS = 1 << 6;

/**
 * A Pulse enables inter-operator communication during a run of the
 * dataflow graph. In addition to the current timestamp, a pulse may also
 * contain a change-set of added, removed or modified data tuples, as well as
 * a pointer to a full backing data source. Tuple change sets may not
 * be fully materialized; for example, to prevent needless array creation
 * a change set may include larger arrays and corresponding filter functions.
 * The pulse provides a {@link visit} method to enable proper and efficient
 * iteration over requested data tuples.
 *
 * In addition, each pulse can track modification flags for data tuple fields.
 * Responsible transform operators should call the {@link modifies} method to
 * indicate changes to data fields. The {@link modified} method enables
 * querying of this modification state.
 *
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 * @param {number} stamp - The current propagation timestamp.
 * @param {string} [encode] - An optional encoding set name, which is then
 *   accessible as Pulse.encode. Operators can respond to (or ignore) this
 *   setting as appropriate. This parameter can be used in conjunction with
 *   the Encode transform in the vega-encode module.
 */
function Pulse(dataflow, stamp, encode) {
  this.dataflow = dataflow;
  this.stamp = stamp == null ? -1 : stamp;
  this.add = [];
  this.rem = [];
  this.mod = [];
  this.fields = null;
  this.encode = encode || null;
}
function materialize(data, filter) {
  const out = [];
  visitArray(data, filter, _ => out.push(_));
  return out;
}
function filter(pulse, flags) {
  const map = {};
  pulse.visit(flags, t => {
    map[tupleid(t)] = 1;
  });
  return t => map[tupleid(t)] ? null : t;
}
function addFilter(a, b) {
  return a ? (t, i) => a(t, i) && b(t, i) : b;
}
Pulse.prototype = {
  /**
   * Sentinel value indicating pulse propagation should stop.
   */
  StopPropagation,
  /**
   * Boolean flag indicating ADD (added) tuples.
   */
  ADD,
  /**
   * Boolean flag indicating REM (removed) tuples.
   */
  REM,
  /**
   * Boolean flag indicating MOD (modified) tuples.
   */
  MOD,
  /**
   * Boolean flag indicating ADD (added) and REM (removed) tuples.
   */
  ADD_REM,
  /**
   * Boolean flag indicating ADD (added) and MOD (modified) tuples.
   */
  ADD_MOD,
  /**
   * Boolean flag indicating ADD, REM and MOD tuples.
   */
  ALL,
  /**
   * Boolean flag indicating all tuples in a data source
   * except for the ADD, REM and MOD tuples.
   */
  REFLOW,
  /**
   * Boolean flag indicating a 'pass-through' to a
   * backing data source, ignoring ADD, REM and MOD tuples.
   */
  SOURCE,
  /**
   * Boolean flag indicating that source data should be
   * suppressed when creating a forked pulse.
   */
  NO_SOURCE,
  /**
   * Boolean flag indicating that field modifications should be
   * suppressed when creating a forked pulse.
   */
  NO_FIELDS,
  /**
   * Creates a new pulse based on the values of this pulse.
   * The dataflow, time stamp and field modification values are copied over.
   * By default, new empty ADD, REM and MOD arrays are created.
   * @param {number} flags - Integer of boolean flags indicating which (if any)
   *   tuple arrays should be copied to the new pulse. The supported flag values
   *   are ADD, REM and MOD. Array references are copied directly: new array
   *   instances are not created.
   * @return {Pulse} - The forked pulse instance.
   * @see init
   */
  fork(flags) {
    return new Pulse(this.dataflow).init(this, flags);
  },
  /**
   * Creates a copy of this pulse with new materialized array
   * instances for the ADD, REM, MOD, and SOURCE arrays.
   * The dataflow, time stamp and field modification values are copied over.
   * @return {Pulse} - The cloned pulse instance.
   * @see init
   */
  clone() {
    const p = this.fork(ALL);
    p.add = p.add.slice();
    p.rem = p.rem.slice();
    p.mod = p.mod.slice();
    if (p.source) p.source = p.source.slice();
    return p.materialize(ALL | SOURCE);
  },
  /**
   * Returns a pulse that adds all tuples from a backing source. This is
   * useful for cases where operators are added to a dataflow after an
   * upstream data pipeline has already been processed, ensuring that
   * new operators can observe all tuples within a stream.
   * @return {Pulse} - A pulse instance with all source tuples included
   *   in the add array. If the current pulse already has all source
   *   tuples in its add array, it is returned directly. If the current
   *   pulse does not have a backing source, it is returned directly.
   */
  addAll() {
    let p = this;
    const reuse = !p.source || p.add === p.rem // special case for indexed set (e.g., crossfilter)
    || !p.rem.length && p.source.length === p.add.length;
    if (reuse) {
      return p;
    } else {
      p = new Pulse(this.dataflow).init(this);
      p.add = p.source;
      p.rem = []; // new operators can ignore rem #2769
      return p;
    }
  },
  /**
   * Initialize this pulse based on the values of another pulse. This method
   * is used internally by {@link fork} to initialize a new forked tuple.
   * The dataflow, time stamp and field modification values are copied over.
   * By default, new empty ADD, REM and MOD arrays are created.
   * @param {Pulse} src - The source pulse to copy from.
   * @param {number} flags - Integer of boolean flags indicating which (if any)
   *   tuple arrays should be copied to the new pulse. The supported flag values
   *   are ADD, REM and MOD. Array references are copied directly: new array
   *   instances are not created. By default, source data arrays are copied
   *   to the new pulse. Use the NO_SOURCE flag to enforce a null source.
   * @return {Pulse} - Returns this Pulse instance.
   */
  init(src, flags) {
    const p = this;
    p.stamp = src.stamp;
    p.encode = src.encode;
    if (src.fields && !(flags & NO_FIELDS)) {
      p.fields = src.fields;
    }
    if (flags & ADD) {
      p.addF = src.addF;
      p.add = src.add;
    } else {
      p.addF = null;
      p.add = [];
    }
    if (flags & REM) {
      p.remF = src.remF;
      p.rem = src.rem;
    } else {
      p.remF = null;
      p.rem = [];
    }
    if (flags & MOD) {
      p.modF = src.modF;
      p.mod = src.mod;
    } else {
      p.modF = null;
      p.mod = [];
    }
    if (flags & NO_SOURCE) {
      p.srcF = null;
      p.source = null;
    } else {
      p.srcF = src.srcF;
      p.source = src.source;
      if (src.cleans) p.cleans = src.cleans;
    }
    return p;
  },
  /**
   * Schedules a function to run after pulse propagation completes.
   * @param {function} func - The function to run.
   */
  runAfter(func) {
    this.dataflow.runAfter(func);
  },
  /**
   * Indicates if tuples have been added, removed or modified.
   * @param {number} [flags] - The tuple types (ADD, REM or MOD) to query.
   *   Defaults to ALL, returning true if any tuple type has changed.
   * @return {boolean} - Returns true if one or more queried tuple types have
   *   changed, false otherwise.
   */
  changed(flags) {
    const f = flags || ALL;
    return f & ADD && this.add.length || f & REM && this.rem.length || f & MOD && this.mod.length;
  },
  /**
   * Forces a "reflow" of tuple values, such that all tuples in the backing
   * source are added to the MOD set, unless already present in the ADD set.
   * @param {boolean} [fork=false] - If true, returns a forked copy of this
   *   pulse, and invokes reflow on that derived pulse.
   * @return {Pulse} - The reflowed pulse instance.
   */
  reflow(fork) {
    if (fork) return this.fork(ALL).reflow();
    const len = this.add.length,
      src = this.source && this.source.length;
    if (src && src !== len) {
      this.mod = this.source;
      if (len) this.filter(MOD, filter(this, ADD));
    }
    return this;
  },
  /**
   * Get/set metadata to pulse requesting garbage collection
   * to reclaim currently unused resources.
   */
  clean(value) {
    if (arguments.length) {
      this.cleans = !!value;
      return this;
    } else {
      return this.cleans;
    }
  },
  /**
   * Marks one or more data field names as modified to assist dependency
   * tracking and incremental processing by transform operators.
   * @param {string|Array<string>} _ - The field(s) to mark as modified.
   * @return {Pulse} - This pulse instance.
   */
  modifies(_) {
    const hash = this.fields || (this.fields = {});
    if (isArray(_)) {
      _.forEach(f => hash[f] = true);
    } else {
      hash[_] = true;
    }
    return this;
  },
  /**
   * Checks if one or more data fields have been modified during this pulse
   * propagation timestamp.
   * @param {string|Array<string>} _ - The field(s) to check for modified.
   * @param {boolean} nomod - If true, will check the modified flag even if
   *   no mod tuples exist. If false (default), mod tuples must be present.
   * @return {boolean} - Returns true if any of the provided fields has been
   *   marked as modified, false otherwise.
   */
  modified(_, nomod) {
    const fields = this.fields;
    return !((nomod || this.mod.length) && fields) ? false : !arguments.length ? !!fields : isArray(_) ? _.some(f => fields[f]) : fields[_];
  },
  /**
   * Adds a filter function to one more tuple sets. Filters are applied to
   * backing tuple arrays, to determine the actual set of tuples considered
   * added, removed or modified. They can be used to delay materialization of
   * a tuple set in order to avoid expensive array copies. In addition, the
   * filter functions can serve as value transformers: unlike standard predicate
   * function (which return boolean values), Pulse filters should return the
   * actual tuple value to process. If a tuple set is already filtered, the
   * new filter function will be appended into a conjuntive ('and') query.
   * @param {number} flags - Flags indicating the tuple set(s) to filter.
   * @param {function(*):object} filter - Filter function that will be applied
   *   to the tuple set array, and should return a data tuple if the value
   *   should be included in the tuple set, and falsy (or null) otherwise.
   * @return {Pulse} - Returns this pulse instance.
   */
  filter(flags, filter) {
    const p = this;
    if (flags & ADD) p.addF = addFilter(p.addF, filter);
    if (flags & REM) p.remF = addFilter(p.remF, filter);
    if (flags & MOD) p.modF = addFilter(p.modF, filter);
    if (flags & SOURCE) p.srcF = addFilter(p.srcF, filter);
    return p;
  },
  /**
   * Materialize one or more tuple sets in this pulse. If the tuple set(s) have
   * a registered filter function, it will be applied and the tuple set(s) will
   * be replaced with materialized tuple arrays.
   * @param {number} flags - Flags indicating the tuple set(s) to materialize.
   * @return {Pulse} - Returns this pulse instance.
   */
  materialize(flags) {
    flags = flags || ALL;
    const p = this;
    if (flags & ADD && p.addF) {
      p.add = materialize(p.add, p.addF);
      p.addF = null;
    }
    if (flags & REM && p.remF) {
      p.rem = materialize(p.rem, p.remF);
      p.remF = null;
    }
    if (flags & MOD && p.modF) {
      p.mod = materialize(p.mod, p.modF);
      p.modF = null;
    }
    if (flags & SOURCE && p.srcF) {
      p.source = p.source.filter(p.srcF);
      p.srcF = null;
    }
    return p;
  },
  /**
   * Visit one or more tuple sets in this pulse.
   * @param {number} flags - Flags indicating the tuple set(s) to visit.
   *   Legal values are ADD, REM, MOD and SOURCE (if a backing data source
   *   has been set).
   * @param {function(object):*} - Visitor function invoked per-tuple.
   * @return {Pulse} - Returns this pulse instance.
   */
  visit(flags, visitor) {
    const p = this,
      v = visitor;
    if (flags & SOURCE) {
      visitArray(p.source, p.srcF, v);
      return p;
    }
    if (flags & ADD) visitArray(p.add, p.addF, v);
    if (flags & REM) visitArray(p.rem, p.remF, v);
    if (flags & MOD) visitArray(p.mod, p.modF, v);
    const src = p.source;
    if (flags & REFLOW && src) {
      const sum = p.add.length + p.mod.length;
      if (sum === src.length) ; else if (sum) {
        visitArray(src, filter(p, ADD_MOD), v);
      } else {
        // if no add/rem/mod tuples, visit source
        visitArray(src, p.srcF, v);
      }
    }
    return p;
  }
};

/**
 * Represents a set of multiple pulses. Used as input for operators
 * that accept multiple pulses at a time. Contained pulses are
 * accessible via the public "pulses" array property. This pulse doe
 * not carry added, removed or modified tuples directly. However,
 * the visit method can be used to traverse all such tuples contained
 * in sub-pulses with a timestamp matching this parent multi-pulse.
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 * @param {number} stamp - The timestamp.
 * @param {Array<Pulse>} pulses - The sub-pulses for this multi-pulse.
 */
function MultiPulse(dataflow, stamp, pulses, encode) {
  const p = this;
  let c = 0;
  this.dataflow = dataflow;
  this.stamp = stamp;
  this.fields = null;
  this.encode = encode || null;
  this.pulses = pulses;
  for (const pulse of pulses) {
    if (pulse.stamp !== stamp) continue;
    if (pulse.fields) {
      const hash = p.fields || (p.fields = {});
      for (const f in pulse.fields) {
        hash[f] = 1;
      }
    }
    if (pulse.changed(p.ADD)) c |= p.ADD;
    if (pulse.changed(p.REM)) c |= p.REM;
    if (pulse.changed(p.MOD)) c |= p.MOD;
  }
  this.changes = c;
}
inherits(MultiPulse, Pulse, {
  /**
   * Creates a new pulse based on the values of this pulse.
   * The dataflow, time stamp and field modification values are copied over.
   * @return {Pulse}
   */
  fork(flags) {
    const p = new Pulse(this.dataflow).init(this, flags & this.NO_FIELDS);
    if (flags !== undefined) {
      if (flags & p.ADD) this.visit(p.ADD, t => p.add.push(t));
      if (flags & p.REM) this.visit(p.REM, t => p.rem.push(t));
      if (flags & p.MOD) this.visit(p.MOD, t => p.mod.push(t));
    }
    return p;
  },
  changed(flags) {
    return this.changes & flags;
  },
  modified(_) {
    const p = this,
      fields = p.fields;
    return !(fields && p.changes & p.MOD) ? 0 : isArray(_) ? _.some(f => fields[f]) : fields[_];
  },
  filter() {
    error('MultiPulse does not support filtering.');
  },
  materialize() {
    error('MultiPulse does not support materialization.');
  },
  visit(flags, visitor) {
    const p = this,
      pulses = p.pulses,
      n = pulses.length;
    let i = 0;
    if (flags & p.SOURCE) {
      for (; i < n; ++i) {
        pulses[i].visit(flags, visitor);
      }
    } else {
      for (; i < n; ++i) {
        if (pulses[i].stamp === p.stamp) {
          pulses[i].visit(flags, visitor);
        }
      }
    }
    return p;
  }
});

/* eslint-disable require-atomic-updates */

/**
 * Evaluates the dataflow and returns a Promise that resolves when pulse
 * propagation completes. This method will increment the current timestamp
 * and process all updated, pulsed and touched operators. When invoked for
 * the first time, all registered operators will be processed. This method
 * should not be invoked by third-party clients, use {@link runAsync} or
 * {@link run} instead.
 * @param {string} [encode] - The name of an encoding set to invoke during
 *   propagation. This value is added to generated Pulse instances;
 *   operators can then respond to (or ignore) this setting as appropriate.
 *   This parameter can be used in conjunction with the Encode transform in
 *   the vega-encode package.
 * @param {function} [prerun] - An optional callback function to invoke
 *   immediately before dataflow evaluation commences.
 * @param {function} [postrun] - An optional callback function to invoke
 *   after dataflow evaluation completes. The callback will be invoked
 *   after those registered via {@link runAfter}.
 * @return {Promise} - A promise that resolves to this dataflow after
 *   evaluation completes.
 */
async function evaluate(encode, prerun, postrun) {
  const df = this,
    async = [];

  // if the pulse value is set, this is a re-entrant call
  if (df._pulse) return reentrant(df);

  // wait for pending datasets to load
  if (df._pending) await df._pending;

  // invoke prerun function, if provided
  if (prerun) await asyncCallback(df, prerun);

  // exit early if there are no updates
  if (!df._touched.length) {
    df.debug('Dataflow invoked, but nothing to do.');
    return df;
  }

  // increment timestamp clock
  const stamp = ++df._clock;

  // set the current pulse
  df._pulse = new Pulse(df, stamp, encode);

  // initialize priority queue, reset touched operators
  df._touched.forEach(op => df._enqueue(op, true));
  df._touched = UniqueList(id);
  let count = 0,
    op,
    next,
    error;
  try {
    while (df._heap.size() > 0) {
      // dequeue operator with highest priority
      op = df._heap.pop();

      // re-queue if rank changed
      if (op.rank !== op.qrank) {
        df._enqueue(op, true);
        continue;
      }

      // otherwise, evaluate the operator
      next = op.run(df._getPulse(op, encode));
      if (next.then) {
        // await if operator returns a promise directly
        next = await next;
      } else if (next.async) {
        // queue parallel asynchronous execution
        async.push(next.async);
        next = StopPropagation;
      }

      // propagate evaluation, enqueue dependent operators
      if (next !== StopPropagation) {
        if (op._targets) op._targets.forEach(op => df._enqueue(op));
      }

      // increment visit counter
      ++count;
    }
  } catch (err) {
    df._heap.clear();
    error = err;
  }

  // reset pulse map
  df._input = {};
  df._pulse = null;
  df.debug(`Pulse ${stamp}: ${count} operators`);
  if (error) {
    df._postrun = [];
    df.error(error);
  }

  // invoke callbacks queued via runAfter
  if (df._postrun.length) {
    const pr = df._postrun.sort((a, b) => b.priority - a.priority);
    df._postrun = [];
    for (let i = 0; i < pr.length; ++i) {
      await asyncCallback(df, pr[i].callback);
    }
  }

  // invoke postrun function, if provided
  if (postrun) await asyncCallback(df, postrun);

  // handle non-blocking asynchronous callbacks
  if (async.length) {
    Promise.all(async).then(cb => df.runAsync(null, () => {
      cb.forEach(f => {
        try {
          f(df);
        } catch (err) {
          df.error(err);
        }
      });
    }));
  }
  return df;
}

/**
 * Queues dataflow evaluation to run once any other queued evaluations have
 * completed and returns a Promise that resolves when the queued pulse
 * propagation completes. If provided, a callback function will be invoked
 * immediately before evaluation commences. This method will ensure a
 * separate evaluation is invoked for each time it is called.
 * @param {string} [encode] - The name of an encoding set to invoke during
 *   propagation. This value is added to generated Pulse instances;
 *   operators can then respond to (or ignore) this setting as appropriate.
 *   This parameter can be used in conjunction with the Encode transform in
 *   the vega-encode package.
 * @param {function} [prerun] - An optional callback function to invoke
 *   immediately before dataflow evaluation commences.
 * @param {function} [postrun] - An optional callback function to invoke
 *   after dataflow evaluation completes. The callback will be invoked
 *   after those registered via {@link runAfter}.
 * @return {Promise} - A promise that resolves to this dataflow after
 *   evaluation completes.
 */
async function runAsync(encode, prerun, postrun) {
  // await previously queued functions
  while (this._running) await this._running;

  // run dataflow, manage running promise
  const clear = () => this._running = null;
  (this._running = this.evaluate(encode, prerun, postrun)).then(clear, clear);
  return this._running;
}

/**
 * Requests dataflow evaluation and the immediately returns this dataflow
 * instance. If there are pending data loading or other asynchronous
 * operations, the dataflow will evaluate asynchronously after this method
 * has been invoked. To track when dataflow evaluation completes, use the
 * {@link runAsync} method instead. This method will raise an error if
 * invoked while the dataflow is already in the midst of evaluation.
 * @param {string} [encode] - The name of an encoding set to invoke during
 *   propagation. This value is added to generated Pulse instances;
 *   operators can then respond to (or ignore) this setting as appropriate.
 *   This parameter can be used in conjunction with the Encode transform in
 *   the vega-encode module.
 * @param {function} [prerun] - An optional callback function to invoke
 *   immediately before dataflow evaluation commences.
 * @param {function} [postrun] - An optional callback function to invoke
 *   after dataflow evaluation completes. The callback will be invoked
 *   after those registered via {@link runAfter}.
 * @return {Dataflow} - This dataflow instance.
 */
function run(encode, prerun, postrun) {
  return this._pulse ? reentrant(this) : (this.evaluate(encode, prerun, postrun), this);
}

/**
 * Schedules a callback function to be invoked after the current pulse
 * propagation completes. If no propagation is currently occurring,
 * the function is invoked immediately. Callbacks scheduled via runAfter
 * are invoked immediately upon completion of the current cycle, before
 * any request queued via runAsync. This method is primarily intended for
 * internal use. Third-party callers using runAfter to schedule a callback
 * that invokes {@link run} or {@link runAsync} should not use this method,
 * but instead use {@link runAsync} with prerun or postrun arguments.
 * @param {function(Dataflow)} callback - The callback function to run.
 *   The callback will be invoked with this Dataflow instance as its
 *   sole argument.
 * @param {boolean} enqueue - A boolean flag indicating that the
 *   callback should be queued up to run after the next propagation
 *   cycle, suppressing immediate invocation when propagation is not
 *   currently occurring.
 * @param {number} [priority] - A priority value used to sort registered
 *   callbacks to determine execution order. This argument is intended
 *   for internal Vega use only.
 */
function runAfter(callback, enqueue, priority) {
  if (this._pulse || enqueue) {
    // pulse propagation is currently running, queue to run after
    this._postrun.push({
      priority: priority || 0,
      callback: callback
    });
  } else {
    // pulse propagation already complete, invoke immediately
    try {
      callback(this);
    } catch (err) {
      this.error(err);
    }
  }
}

/**
 * Raise an error for re-entrant dataflow evaluation.
 */
function reentrant(df) {
  df.error('Dataflow already running. Use runAsync() to chain invocations.');
  return df;
}

/**
 * Enqueue an operator into the priority queue for evaluation. The operator
 * will be enqueued if it has no registered pulse for the current cycle, or if
 * the force argument is true. Upon enqueue, this method also sets the
 * operator's qrank to the current rank value.
 * @param {Operator} op - The operator to enqueue.
 * @param {boolean} [force] - A flag indicating if the operator should be
 *   forceably added to the queue, even if it has already been previously
 *   enqueued during the current pulse propagation. This is useful when the
 *   dataflow graph is dynamically modified and the operator rank changes.
 */
function enqueue(op, force) {
  const q = op.stamp < this._clock;
  if (q) op.stamp = this._clock;
  if (q || force) {
    op.qrank = op.rank;
    this._heap.push(op);
  }
}

/**
 * Provide a correct pulse for evaluating an operator. If the operator has an
 * explicit source operator, we will try to pull the pulse(s) from it.
 * If there is an array of source operators, we build a multi-pulse.
 * Otherwise, we return a current pulse with correct source data.
 * If the pulse is the pulse map has an explicit target set, we use that.
 * Else if the pulse on the upstream source operator is current, we use that.
 * Else we use the pulse from the pulse map, but copy the source tuple array.
 * @param {Operator} op - The operator for which to get an input pulse.
 * @param {string} [encode] - An (optional) encoding set name with which to
 *   annotate the returned pulse. See {@link run} for more information.
 */
function getPulse(op, encode) {
  const s = op.source,
    stamp = this._clock;
  return s && isArray(s) ? new MultiPulse(this, stamp, s.map(_ => _.pulse), encode) : this._input[op.id] || singlePulse(this._pulse, s && s.pulse);
}
function singlePulse(p, s) {
  if (s && s.stamp === p.stamp) {
    return s;
  }
  p = p.fork();
  if (s && s !== StopPropagation) {
    p.source = s.source;
  }
  return p;
}

const NO_OPT = {
  skip: false,
  force: false
};

/**
 * Touches an operator, scheduling it to be evaluated. If invoked outside of
 * a pulse propagation, the operator will be evaluated the next time this
 * dataflow is run. If invoked in the midst of pulse propagation, the operator
 * will be queued for evaluation if and only if the operator has not yet been
 * evaluated on the current propagation timestamp.
 * @param {Operator} op - The operator to touch.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function touch(op, options) {
  const opt = options || NO_OPT;
  if (this._pulse) {
    // if in midst of propagation, add to priority queue
    this._enqueue(op);
  } else {
    // otherwise, queue for next propagation
    this._touched.add(op);
  }
  if (opt.skip) op.skip(true);
  return this;
}

/**
 * Updates the value of the given operator.
 * @param {Operator} op - The operator to update.
 * @param {*} value - The value to set.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function update(op, value, options) {
  const opt = options || NO_OPT;
  if (op.set(value) || opt.force) {
    this.touch(op, opt);
  }
  return this;
}

/**
 * Pulses an operator with a changeset of tuples. If invoked outside of
 * a pulse propagation, the pulse will be applied the next time this
 * dataflow is run. If invoked in the midst of pulse propagation, the pulse
 * will be added to the set of active pulses and will be applied if and
 * only if the target operator has not yet been evaluated on the current
 * propagation timestamp.
 * @param {Operator} op - The operator to pulse.
 * @param {ChangeSet} value - The tuple changeset to apply.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function pulse(op, changeset, options) {
  this.touch(op, options || NO_OPT);
  const p = new Pulse(this, this._clock + (this._pulse ? 0 : 1)),
    t = op.pulse && op.pulse.source || [];
  p.target = op;
  this._input[op.id] = changeset.pulse(p, t);
  return this;
}

function Heap(cmp) {
  let nodes = [];
  return {
    clear: () => nodes = [],
    size: () => nodes.length,
    peek: () => nodes[0],
    push: x => {
      nodes.push(x);
      return siftdown(nodes, 0, nodes.length - 1, cmp);
    },
    pop: () => {
      const last = nodes.pop();
      let item;
      if (nodes.length) {
        item = nodes[0];
        nodes[0] = last;
        siftup(nodes, 0, cmp);
      } else {
        item = last;
      }
      return item;
    }
  };
}
function siftdown(array, start, idx, cmp) {
  let parent, pidx;
  const item = array[idx];
  while (idx > start) {
    pidx = idx - 1 >> 1;
    parent = array[pidx];
    if (cmp(item, parent) < 0) {
      array[idx] = parent;
      idx = pidx;
      continue;
    }
    break;
  }
  return array[idx] = item;
}
function siftup(array, idx, cmp) {
  const start = idx,
    end = array.length,
    item = array[idx];
  let cidx = (idx << 1) + 1,
    ridx;
  while (cidx < end) {
    ridx = cidx + 1;
    if (ridx < end && cmp(array[cidx], array[ridx]) >= 0) {
      cidx = ridx;
    }
    array[idx] = array[cidx];
    idx = cidx;
    cidx = (idx << 1) + 1;
  }
  array[idx] = item;
  return siftdown(array, start, idx, cmp);
}

/**
 * A dataflow graph for reactive processing of data streams.
 * @constructor
 */
function Dataflow() {
  this.logger(logger());
  this.logLevel(Error);
  this._clock = 0;
  this._rank = 0;
  this._locale = defaultLocale();
  try {
    this._loader = loader();
  } catch (e) {
    // do nothing if loader module is unavailable
  }
  this._touched = UniqueList(id);
  this._input = {};
  this._pulse = null;
  this._heap = Heap((a, b) => a.qrank - b.qrank);
  this._postrun = [];
}
function logMethod(method) {
  return function () {
    return this._log[method].apply(this, arguments);
  };
}
Dataflow.prototype = {
  /**
   * The current timestamp of this dataflow. This value reflects the
   * timestamp of the previous dataflow run. The dataflow is initialized
   * with a stamp value of 0. The initial run of the dataflow will have
   * a timestap of 1, and so on. This value will match the
   * {@link Pulse.stamp} property.
   * @return {number} - The current timestamp value.
   */
  stamp() {
    return this._clock;
  },
  /**
   * Gets or sets the loader instance to use for data file loading. A
   * loader object must provide a "load" method for loading files and a
   * "sanitize" method for checking URL/filename validity. Both methods
   * should accept a URI and options hash as arguments, and return a Promise
   * that resolves to the loaded file contents (load) or a hash containing
   * sanitized URI data with the sanitized url assigned to the "href" property
   * (sanitize).
   * @param {object} _ - The loader instance to use.
   * @return {object|Dataflow} - If no arguments are provided, returns
   *   the current loader instance. Otherwise returns this Dataflow instance.
   */
  loader(_) {
    if (arguments.length) {
      this._loader = _;
      return this;
    } else {
      return this._loader;
    }
  },
  /**
   * Gets or sets the locale instance to use for formatting and parsing
   * string values. The locale object should be provided by the
   * vega-format library, and include methods such as format, timeFormat,
   * utcFormat, timeParse, and utcParse.
   * @param {object} _ - The locale instance to use.
   * @return {object|Dataflow} - If no arguments are provided, returns
   *   the current locale instance. Otherwise returns this Dataflow instance.
   */
  locale(_) {
    if (arguments.length) {
      this._locale = _;
      return this;
    } else {
      return this._locale;
    }
  },
  /**
   * Get or set the logger instance used to log messages. If no arguments are
   * provided, returns the current logger instance. Otherwise, sets the logger
   * and return this Dataflow instance. Provided loggers must support the full
   * API of logger objects generated by the vega-util logger method. Note that
   * by default the log level of the new logger will be used; use the logLevel
   * method to adjust the log level as needed.
   */
  logger(logger) {
    if (arguments.length) {
      this._log = logger;
      return this;
    } else {
      return this._log;
    }
  },
  /**
   * Logs an error message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit error messages.
   */
  error: logMethod('error'),
  /**
   * Logs a warning message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit warning messages.
   */
  warn: logMethod('warn'),
  /**
   * Logs a information message. By default, logged messages are written to
   * console output. The message will only be logged if the current log level is
   * high enough to permit information messages.
   */
  info: logMethod('info'),
  /**
   * Logs a debug message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit debug messages.
   */
  debug: logMethod('debug'),
  /**
   * Get or set the current log level. If an argument is provided, it
   * will be used as the new log level.
   * @param {number} [level] - Should be one of None, Warn, Info
   * @return {number} - The current log level.
   */
  logLevel: logMethod('level'),
  /**
   * Empty entry threshold for garbage cleaning. Map data structures will
   * perform cleaning once the number of empty entries exceeds this value.
   */
  cleanThreshold: 1e4,
  // OPERATOR REGISTRATION
  add,
  connect,
  rank,
  rerank,
  // OPERATOR UPDATES
  pulse,
  touch,
  update,
  changeset,
  // DATA LOADING
  ingest,
  parse,
  preload,
  request,
  // EVENT HANDLING
  events,
  on,
  // PULSE PROPAGATION
  evaluate,
  run,
  runAsync,
  runAfter,
  _enqueue: enqueue,
  _getPulse: getPulse
};

/**
 * Abstract class for operators that process data tuples.
 * Subclasses must provide a {@link transform} method for operator processing.
 * @constructor
 * @param {*} [init] - The initial value for this operator.
 * @param {object} [params] - The parameters for this operator.
 * @param {Operator} [source] - The operator from which to receive pulses.
 */
function Transform(init, params) {
  Operator.call(this, init, null, params);
}
inherits(Transform, Operator, {
  /**
   * Overrides {@link Operator.evaluate} for transform operators.
   * Internally, this method calls {@link evaluate} to perform processing.
   * If {@link evaluate} returns a falsy value, the input pulse is returned.
   * This method should NOT be overridden, instead overrride {@link evaluate}.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return the output pulse for this operator (or StopPropagation)
   */
  run(pulse) {
    if (pulse.stamp < this.stamp) return pulse.StopPropagation;
    let rv;
    if (this.skip()) {
      this.skip(false);
    } else {
      rv = this.evaluate(pulse);
    }
    rv = rv || pulse;
    if (rv.then) {
      rv = rv.then(_ => this.pulse = _);
    } else if (rv !== pulse.StopPropagation) {
      this.pulse = rv;
    }
    return rv;
  },
  /**
   * Overrides {@link Operator.evaluate} for transform operators.
   * Marshalls parameter values and then invokes {@link transform}.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return {Pulse} The output pulse (or StopPropagation). A falsy return
       value (including undefined) will let the input pulse pass through.
  */
  evaluate(pulse) {
    const params = this.marshall(pulse.stamp),
      out = this.transform(params, pulse);
    params.clear();
    return out;
  },
  /**
   * Process incoming pulses.
   * Subclasses should override this method to implement transforms.
   * @param {Parameters} _ - The operator parameter values.
   * @param {Pulse} pulse - The current dataflow pulse.
   * @return {Pulse} The output pulse (or StopPropagation). A falsy return
   *   value (including undefined) will let the input pulse pass through.
   */
  transform() {}
});

const transforms = {};
function definition(type) {
  const t = transform(type);
  return t && t.Definition || null;
}
function transform(type) {
  type = type && type.toLowerCase();
  return hasOwnProperty(transforms, type) ? transforms[type] : null;
}

export { Dataflow, EventStream, MultiPulse, Operator, Parameters, Pulse, Transform, UniqueList, asyncCallback, changeset, definition, derive, ingest$1 as ingest, isChangeSet, isTuple, rederive, replace, stableCompare, transform, transforms, tupleid };

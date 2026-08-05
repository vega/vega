import Parameters from './Parameters.js';
import UniqueList from './util/UniqueList.js';
import {array, error, id, isArray} from 'vega-util';

let OP_ID = 0;

const PULSE = 'pulse',
      NO_PARAMS = new Parameters();

// Boolean Flags
const SKIP     = 1,
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
export default function Operator(init, update, params, react) {
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
  return function(state) {
    const f = this.flags;
    if (arguments.length === 0) return !!(f & bit);
    this.flags = state ? (f | bit) : (f & ~bit);
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
  skip: flag(SKIP),

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
    const argval = (this._argval = this._argval || new Parameters()),
          argops = (this._argops = this._argops || []),
          deps = [];
    let name, value, n, i;

    const add = (name, index, value) => {
      if (value instanceof Operator) {
        if (value !== this) {
          if (react) value.targets().add(this);
          deps.push(value);
        }
        argops.push({op:value, name:name, index:index});
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
    return (this.pulse = rv || pulse);
  }
};

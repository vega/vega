import {isArray} from 'vega-util';

const CACHE = '_:mod:_';

/**
 * Hash that tracks modifications to assigned values.
 * Callers *must* use the set method to update values.
 */
export default function Parameters() {
  Object.defineProperty(this, CACHE, {writable: true, value: {}});
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
      for (const k in mod) { if (mod[k]) return true; }
      return false;
    } else if (isArray(name)) {
      for (let k = 0; k < name.length; ++k) {
        if (mod[name[k]]) return true;
      }
      return false;
    }
    return (index != null && index >= 0)
      ? (index + 1 < mod[name] || !!mod[index + ':' + name])
      : !!mod[name];
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

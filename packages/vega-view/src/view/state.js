/**
 * Get or set the current signal state. If an input object is provided,
 * all property on that object will be assigned to signals of this view,
 * and the run method will be invoked. If no argument is provided,
 * returns a hash of all current signal values.
 * @param {object} [state] - The state vector to set.
 * @return {object|View} - If invoked with arguments, returns the
 *   current signal state. Otherwise returns this View instance.
 */
export default function(state) {
  var key, skip;
  if (arguments.length) {
    skip = {skip: true};
    for (key in state) this.signal(key, state[key], skip);
    return this.run();
  } else {
    state = {};
    for (key in this._signals) state[key] = this.signal(key);
    return state;
  }
}

import {changeset} from 'vega-dataflow';
import {truthy} from 'vega-util';

var SKIP = {skip: true};

/**
 * Get or set the current view state. If no argument is provided,
 * returns an object containing all current signal values and modified
 * data sets. If an argument is provided, it should be a state object
 * returned by a previous call to this method.
 * @param {object} [state] - The state object to set.
 * @return {object|View} - If invoked with arguments, returns the
 *   current signal state. Otherwise returns this View instance.
 */
export default function(state) {
  if (arguments.length) {
    this._trigger = false;
    setState(this._runtime, state);
    this.run();
    this._trigger = true;
    return this;
  } else {
    return getState(this._runtime);
  }
}

function getState(context) {
  var signals = {},
      data = {},
      state = {signals: signals, data: data};

  Object.keys(context.signals).forEach(function(key) {
    if (key !== 'root' && key !== 'parent') {
      signals[key] = context.signals[key].value;
    }
  });

  Object.keys(context.data).forEach(function(key) {
    var dataset = context.data[key];
    if (dataset.modified) {
      data[key] = dataset.input.value;
    }
  });

  if (context.subcontext) {
    state.subcontext = context.subcontext.map(getState);
  }

  return state;
}

function setState(context, state) {
  var df = context.dataflow,
      signals = state.signals,
      data = state.data;

  Object.keys(signals || {}).forEach(function(key) {
    df.update(context.signals[key], signals[key], SKIP);
  });

  Object.keys(data || {}).forEach(function(key) {
    df.pulse(
      context.data[key].input,
      changeset().remove(truthy).insert(data[key])
    );
  });

  (state.subcontext || []).forEach(function(substate, i) {
    var ctx = context.subcontext[i];
    if (ctx) setState(ctx, substate);
  });
}

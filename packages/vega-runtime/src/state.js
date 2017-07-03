import {truthy} from 'vega-util';

var SKIP = {skip: true};

export function getState(options) {
  var ctx = this,
      state = {};

  if (options.signals) {
    var signals = (state.signals = {});
    Object.keys(ctx.signals).forEach(function(key) {
      var op = ctx.signals[key];
      if (options.signals(key, op)) {
        signals[key] = op.value;
      }
    });
  }

  if (options.data) {
    var data = (state.data = {});
    Object.keys(ctx.data).forEach(function(key) {
      var dataset = ctx.data[key];
      if (options.data(key, dataset)) {
        data[key] = dataset.input.value;
      }
    });
  }

  if (ctx.subcontext && options.recurse !== false) {
    state.subcontext = ctx.subcontext.map(function(ctx) {
      return ctx.getState(options);
    });
  }

  return state;
}

export function setState(state) {
  var ctx = this,
      df = ctx.dataflow,
      data = state.data,
      signals = state.signals;

  Object.keys(signals || {}).forEach(function(key) {
    df.update(ctx.signals[key], signals[key], SKIP);
  });

  Object.keys(data || {}).forEach(function(key) {
    df.pulse(
      ctx.data[key].input,
      df.changeset().remove(truthy).insert(data[key])
    );
  });

  (state.subcontext  || []).forEach(function(substate, i) {
    var subctx = ctx.subcontext[i];
    if (subctx) subctx.setState(substate);
  });
}

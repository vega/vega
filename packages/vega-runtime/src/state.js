import {truthy} from 'vega-util';

const SKIP = {skip: true};

export function getState(options) {
  const ctx = this;
  const state = {};

  if (options.signals) {
    const signals = (state.signals = {});
    Object.keys(ctx.signals).forEach(function (key) {
      const op = ctx.signals[key];
      if (options.signals(key, op)) {
        signals[key] = op.value;
      }
    });
  }

  if (options.data) {
    const data = (state.data = {});
    Object.keys(ctx.data).forEach(function (key) {
      const dataset = ctx.data[key];
      if (options.data(key, dataset)) {
        data[key] = dataset.input.value;
      }
    });
  }

  if (ctx.subcontext && options.recurse !== false) {
    state.subcontext = ctx.subcontext.map(function (ctx) {
      return ctx.getState(options);
    });
  }

  return state;
}

export function setState(state) {
  const ctx = this;
  const df = ctx.dataflow;
  const data = state.data;
  const signals = state.signals;

  Object.keys(signals || {}).forEach(function (key) {
    df.update(ctx.signals[key], signals[key], SKIP);
  });

  Object.keys(data || {}).forEach(function (key) {
    df.pulse(ctx.data[key].input, df.changeset().remove(truthy).insert(data[key]));
  });

  (state.subcontext || []).forEach(function (substate, i) {
    const subctx = ctx.subcontext[i];
    if (subctx) subctx.setState(substate);
  });
}

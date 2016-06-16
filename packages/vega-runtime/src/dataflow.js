import parseOperator from './operators';
import parseStream from './streams';
import parseUpdate from './updates';

import {Dataflow} from 'vega-dataflow';

/**
 * Parse a serialized dataflow specification.
 */
export default function dataflow(spec, df) {
  df = df || new Dataflow();

  var ctx = getContext(df);

  // parse operators
  (spec.operators || []).forEach(function(entry) {
    ctx.operators[entry.id] = parseOperator(entry, df, ctx);
  });

  // parse streams
  (spec.streams || []).forEach(function(entry) {
    ctx.streams[entry.id] = parseStream(entry, df, ctx);
  });

  // parse updates
  (spec.updates || []).forEach(function(entry) {
    ctx.updates[entry.id] = parseUpdate(entry, df, ctx);
  });

  return {
    dataflow: df,
    context: ctx
  }
}

function getContext(df) {
  var operators = {},
      streams = {};

  function operator(id) {
    return operators.hasOwnProperty(id) && operators[id];
  }

  function stream(id) {
    return streams.hasOwnProperty(id) && streams[id];
  }

  return {
    events: df.events.bind(df),
    updates: {},
    fn: {},
    operators: operators,
    operator: operator,
    streams: streams,
    stream: stream
  };
}

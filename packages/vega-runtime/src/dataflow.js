import context from './context';
import parseOperator from './operator';
import parseStream from './stream';
import parseUpdate from './update';

import {Dataflow} from 'vega-dataflow';

/**
 * Parse a serialized dataflow specification.
 */
export default function parseDataflow(spec, df, ctx) {
  df = df || new Dataflow();
  ctx = ctx || context(df);

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

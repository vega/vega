import parseParameters from './parameters';
import {handlerExpression} from './expression';

import {error} from 'vega-dataflow';

/**
 * Parse an event-driven operator update.
 */
export default function parseUpdate(spec, df, ctx) {
  var stream = ctx.stream(spec.stream),
      target = ctx.operator(spec.operator),
      update = spec.update,
      params = undefined;

  if (!stream) error('Stream not defined: ' + spec.stream);
  if (!target) error('Operator not defined: ' + spec.operator);

  if (update && update.$expr) {
    if (update.$params) {
      params = parseParameters(update.$params, ctx);
    }
    update = handlerExpression(update.$expr);
  }

  df.on(stream, target, update, params, spec.options);
}

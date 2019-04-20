import {eventExpression, handlerExpression} from './expression';
import parseParameters from './parameters';
import {error, isObject} from 'vega-util';

/**
 * Parse an event-driven operator update.
 */
export default function(spec, ctx) {
  var srcid = isObject(srcid = spec.source) ? srcid.$ref : srcid,
      source = ctx.get(srcid),
      target = null,
      update = spec.update,
      params = undefined;

  if (!source) error('Source not defined: ' + spec.source);

  if (spec.target && spec.target.$expr) {
    target = eventExpression(spec.target.$expr, ctx);
  } else {
    target = ctx.get(spec.target);
  }

  if (update && update.$expr) {
    if (update.$params) {
      params = parseParameters(update.$params, ctx);
    }
    update = handlerExpression(update.$expr, ctx);
  }

  ctx.update(spec, source, target, update, params);
}

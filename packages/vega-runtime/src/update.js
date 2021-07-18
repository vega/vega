import {error, isObject} from 'vega-util';

/**
 * Parse an event-driven operator update.
 */
export default function(spec) {
  var ctx = this;
  var srcid = isObject(srcid = spec.source) ? srcid.$ref : srcid;
  var source = ctx.get(srcid);
  var target = null;
  var update = spec.update;
  var params = undefined;

  if (!source) error('Source not defined: ' + spec.source);

  target = spec.target && spec.target.$expr
    ? ctx.eventExpression(spec.target.$expr)
    : ctx.get(spec.target);

  if (update && update.$expr) {
    if (update.$params) {
      params = ctx.parseParameters(update.$params);
    }
    update = ctx.handlerExpression(update.$expr);
  }

  ctx.update(spec, source, target, update, params);
}

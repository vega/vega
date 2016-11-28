import {eventExpression} from './expression';
import {error} from 'vega-util';

/**
 * Parse an event stream specification.
 */
export default function(spec, ctx) {
  var filter = spec.filter != null ? eventExpression(spec.filter, ctx) : undefined,
      stream = spec.stream != null ? ctx.get(spec.stream) : undefined,
      args;

  if (spec.source) {
    stream = ctx.events(spec.source, spec.type, filter);
  }
  else if (spec.merge) {
    args = spec.merge.map(ctx.get.bind(ctx));
    stream = args[0].merge.apply(args[0], args.slice(1));
  }

  if (spec.between) {
    args = spec.between.map(ctx.get.bind(ctx));
    stream = stream.between(args[0], args[1]);
  }

  if (spec.filter) {
    stream = stream.filter(filter);
  }

  if (spec.throttle != null) {
    stream = stream.throttle(+spec.throttle);
  }

  if (spec.debounce != null) {
    stream = stream.debounce(+spec.debounce);
  }

  if (stream == null) {
    error('Invalid stream definition: ' + JSON.stringify(spec));
  }

  if (spec.consume) stream.consume(true);

  ctx.stream(spec, stream);
}

import {eventExpression} from './expressions';

import {error} from 'vega-dataflow';

/**
 * Parse an event stream specification.
 */
export default function parseStream(spec, df, ctx) {
  var filter = spec.filter != null ? eventExpression(spec.filter) : undefined,
      stream = spec.stream != null ? ctx.stream(spec.stream) : undefined,
      args;

  if (spec.source) {
    stream = ctx.events(spec.source, spec.type, filter);
  }

  else if (spec.filter) {
    stream = stream.filter(filter);
  }

  else if (spec.merge) {
    args = spec.merge.map(ctx.stream);
    stream = args[0].merge.apply(args[0], args.slice(1));
  }

  else if (spec.between) {
    args = spec.between.map(ctx.stream);
    stream = stream.between(args[0], args[1]);
  }

  else if (spec.debounce != null) {
    stream = stream.debounce(+spec.debounce);
  }

  else if (spec.throttle != null) {
    stream = stream.throttle(+spec.throttle);
  }

  if (stream == null) {
    error('Invalid stream definition: ' + JSON.stringify(spec));
  }
  if (spec.consume) stream.consume(true);

  return stream;
}

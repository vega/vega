import {default as parseOperator, parseOperatorParameters} from './operator';
import parseStream from './stream';
import parseUpdate from './update';

/**
 * Parse a serialized dataflow specification.
 */
export default function(spec, ctx) {
  var operators = spec.operators || [];

  // parse background
  if (spec.background) {
    ctx.background = spec.background;
  }

  // parse event configuration
  if (spec.eventConfig) {
    ctx.eventConfig = spec.eventConfig;
  }

  // parse operators
  operators.forEach(function(entry) {
    parseOperator(entry, ctx);
  });

  // parse operator parameters
  operators.forEach(function(entry) {
    parseOperatorParameters(entry, ctx);
  });

  // parse streams
  (spec.streams || []).forEach(function(entry) {
    parseStream(entry, ctx);
  });

  // parse updates
  (spec.updates || []).forEach(function(entry) {
    parseUpdate(entry, ctx);
  });

  return ctx.resolve();
}

import parseOperator from './operator';
import parseStream from './stream';
import parseUpdate from './update';

/**
 * Parse a serialized dataflow specification.
 */
export default function parseDataflow(spec, ctx) {
  // parse operators
  (spec.operators || []).forEach(function(entry) {
    parseOperator(entry, ctx);
  });

  // parse streams
  (spec.streams || []).forEach(function(entry) {
    parseStream(entry, ctx);
  });

  // parse updates
  (spec.updates || []).forEach(function(entry) {
    parseUpdate(entry, ctx);
  });

  return ctx;
}

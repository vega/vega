import {operatorExpression} from './expression';
import parseParameters from './parameters';

/**
 * Parse a dataflow operator.
 */
export default function parseOperator(spec, ctx) {
  var params, update;

  if (spec.params) {
    params = parseParameters(spec.params, ctx);
  }

  if (spec.type === 'Operator' || !spec.type) {
    if (spec.update) {
      update = operatorExpression(spec.update, ctx);
    }
    ctx.operator(spec, update, params);
  } else {
    ctx.transform(spec, spec.type, params);
  }
}

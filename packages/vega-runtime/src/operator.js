import {operatorExpression} from './expression';
import parseParameters from './parameters';

/**
 * Parse a dataflow operator.
 */
export default function parseOperator(spec, ctx) {
  var params;

  if (spec.type === 'Operator') {
    ctx.operator(spec, spec.value);
    return;
  }

  if (spec.params) {
    params = parseParameters(spec.params, ctx);
  }

  if (spec.type === 'Expression') {
    ctx.operator(spec, operatorExpression(spec.value), params);
  } else {
    ctx.transform(spec, params);
  }
}

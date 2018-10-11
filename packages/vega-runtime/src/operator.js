import {operatorExpression} from './expression';
import parseParameters from './parameters';
import {isOperator} from './util';
import {error} from 'vega-util';

/**
 * Parse a dataflow operator.
 */
export default function(spec, ctx) {
  if (isOperator(spec.type) || !spec.type) {
    ctx.operator(spec,
      spec.update ? operatorExpression(spec.update, ctx) : null);
  } else {
    ctx.transform(spec, spec.type);
  }
}

/**
 * Parse and assign operator parameters.
 */
export function parseOperatorParameters(spec, ctx) {
  var op, params;
  if (spec.params) {
    if (!(op = ctx.get(spec.id))) {
      error('Invalid operator id: ' + spec.id);
    }
    params = parseParameters(spec.params, ctx);
    ctx.dataflow.connect(op, op.parameters(params, spec.react));
  }
}

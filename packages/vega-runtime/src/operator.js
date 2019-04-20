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
  if (spec.params) {
    var op = ctx.get(spec.id);
    if (!op) error('Invalid operator id: ' + spec.id);
    ctx.dataflow.connect(op, op.parameters(
      parseParameters(spec.params, ctx),
      spec.react,
      spec.initonly
    ));
  }
}

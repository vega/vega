import parseParameters from './parameters';
import {operatorExpression} from './expression';

import * as vega from 'vega-dataflow';

/**
 * Parse a dataflow operator.
 */
export default function parseOperator(spec, df, ctx) {
  var op, params;

  if (spec.type === 'Operator') {
    return df.add(spec.value);
  }

  if (spec.params) {
    params = parseParameters(spec.params, ctx);
  }

  if (spec.type === 'Expression') {
    op = df.add(operatorExpression(spec.value), params);
  } else {
    op = df.add(vega[spec.type], params);
    if (spec.type === 'Collect' && spec.value) {
      df.pulse(op, vega.changeset().insert(spec.value));
    }
  }

  return op;
}

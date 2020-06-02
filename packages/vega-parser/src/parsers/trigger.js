import {operator} from '../util';
import {parseExpression} from 'vega-functions';

export default function(spec, scope, name) {
  let remove = spec.remove,
      insert = spec.insert,
      toggle = spec.toggle,
      modify = spec.modify,
      values = spec.values,
      op = scope.add(operator()),
      update, expr;

  update = 'if(' + spec.trigger + ',modify("'
    + name + '",'
    + [insert, remove, toggle, modify, values]
        .map(_ => _ == null ? 'null' : _)
        .join(',')
    + '),0)';

  expr = parseExpression(update, scope);
  op.update = expr.$expr;
  op.params = expr.$params;
}

import {operator} from '../util.js';
import {parseExpression} from 'vega-functions';

export default function(spec, scope, name) {
  const remove = spec.remove,
        insert = spec.insert,
        toggle = spec.toggle,
        modify = spec.modify,
        values = spec.values,
        op = scope.add(operator());

  const update = 'if(' + spec.trigger + ',modify("'
    + name + '",'
    + [insert, remove, toggle, modify, values]
        .map(_ => _ == null ? 'null' : _)
        .join(',')
    + '),0)';

  const expr = parseExpression(update, scope);
  op.update = expr.$expr;
  op.params = expr.$params;
}

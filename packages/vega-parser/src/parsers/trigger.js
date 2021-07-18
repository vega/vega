import {operator} from '../util';
import {parseExpression} from 'vega-functions';

export default function(spec, scope, name) {
  const remove = spec.remove;
  const insert = spec.insert;
  const toggle = spec.toggle;
  const modify = spec.modify;
  const values = spec.values;
  const op = scope.add(operator());

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

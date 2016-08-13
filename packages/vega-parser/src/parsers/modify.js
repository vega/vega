import parseExpression from './expression';
import {operator} from '../util';

export default function(spec, scope, name) {
  var remove = spec.remove,
      insert = spec.insert,
      toggle = spec.toggle,
      op = scope.add(operator()),
      update, expr;

  update = 'if(' + spec.trigger + ',modify("'
    + name + '",'
    + [insert, remove, toggle]
        .map(function(_) { return _ == null ? 'null' : _; })
        .join(',')
    + '),0)';

  expr = parseExpression(update, scope);
  op.update = expr.$expr;
  op.params = expr.$params;
}

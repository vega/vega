import parseExpression from './expression';
import parseUpdate from './update';

export default function(signal, scope) {
  var op = scope.getSignal(signal.name);

  if (signal.update) {
    // TODO: in runtime, change update to {$expr, $params}?
    var expr = parseExpression(signal.update, scope);
    op.update = expr.$expr;
    if (expr.$params) op.params = expr.$params;
  }

  if (signal.on) {
    signal.on.forEach(function(_) {
      parseUpdate(_, scope, op.id);
    });
  }
}

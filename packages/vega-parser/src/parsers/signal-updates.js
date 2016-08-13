import parseExpression from './expression';
import parseUpdate from './update';

export default function(signal, scope) {
  var op = scope.getSignal(signal.name);

  if (signal.update) {
    var expr = parseExpression(signal.update, scope);
    op.update = expr.$expr;
    op.params = expr.$params;
  }

  if (signal.on) {
    signal.on.forEach(function(_) {
      parseUpdate(_, scope, op.id);
    });
  }
}

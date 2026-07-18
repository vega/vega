import parseUpdate from './update.js';
import {parseExpression} from 'vega-functions';
import {error} from 'vega-util';

export default function(signal, scope) {
  const op = scope.getSignal(signal.name);
  let expr = signal.update;

  if (signal.init) {
    if (expr) {
      error('Signals can not include both init and update expressions.');
    } else {
      expr = signal.init;
      op.initonly = true;
    }
  }

  if (expr) {
    expr = parseExpression(expr, scope);
    op.update = expr.$expr;
    op.params = expr.$params;
  }

  if (signal.on) {
    signal.on.forEach(_ => parseUpdate(_, scope, op.id));
  }
}

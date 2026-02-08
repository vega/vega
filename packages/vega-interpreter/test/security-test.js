import tape from 'tape';
import {parseExpression} from 'vega-expression';
import interpret from '../src/interpret.js';
import Functions from '../src/functions.js';

tape('Block DOM property access (non-datum objects only)', t => {
  function evaluate(str, datum = {}, event = {}) {
    const ast = parseExpression(str);
    return interpret(ast, Functions, {}, datum, event);
  }

  // Block access on non-datum objects
  const event = {window: 'test', document: 'test', cookie: 'test'};
  t.equal(evaluate('event.window', {}, event), undefined, 'blocks restricted property via dot notation');
  t.equal(evaluate('event.document', {}, event), undefined, 'blocks restricted property via dot notation');
  t.equal(evaluate('event["cookie"]', {}, event), undefined, 'blocks restricted property via bracket notation');

  // Allow datum access to any property (user data should be unrestricted)
  const datum = {window: 'value1', document: 'value2', cookie: 'value3'};
  t.equal(evaluate('datum.window', datum), 'value1', 'allows datum property access');
  t.equal(evaluate('datum.document', datum), 'value2', 'allows datum property access');
  t.equal(evaluate('datum["cookie"]', datum), 'value3', 'allows computed datum property access');

  t.end();
});

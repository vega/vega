import tape from 'tape';
import {parseExpression} from 'vega-expression';
import interpret from '../src/interpret.js';
import Functions from '../src/functions.js';

tape('Allowlist event property access (non-datum objects only)', t => {
  function evaluate(str, datum = {}, event = {}) {
    const ast = parseExpression(str);
    return interpret(ast, Functions, {}, datum, event);
  }

  // Block properties NOT on the allowlist
  const event = {window: 'test', document: 'test', cookie: 'test', view: 'test'};
  t.equal(evaluate('event.window', {}, event), undefined, 'blocks non-allowlisted property via dot notation');
  t.equal(evaluate('event.document', {}, event), undefined, 'blocks non-allowlisted property via dot notation');
  t.equal(evaluate('event["cookie"]', {}, event), undefined, 'blocks non-allowlisted property via bracket notation');
  t.equal(evaluate('event.view', {}, event), undefined, 'blocks native UIEvent.view (returns Window)');

  // Allow properties ON the allowlist
  const safeEvent = {type: 'click', clientX: 100, clientY: 200, shiftKey: true};
  t.equal(evaluate('event.type', {}, safeEvent), 'click', 'allows allowlisted property: type');
  t.equal(evaluate('event.clientX', {}, safeEvent), 100, 'allows allowlisted property: clientX');
  t.equal(evaluate('event.shiftKey', {}, safeEvent), true, 'allows allowlisted property: shiftKey');
  t.equal(evaluate('event["clientY"]', {}, safeEvent), 200, 'allows allowlisted property via bracket notation');

  // Allow datum access to ANY property (user data is unrestricted)
  const datum = {window: 'value1', document: 'value2', cookie: 'value3'};
  t.equal(evaluate('datum.window', datum), 'value1', 'allows datum property access');
  t.equal(evaluate('datum.document', datum), 'value2', 'allows datum property access');
  t.equal(evaluate('datum["cookie"]', datum), 'value3', 'allows computed datum property access');

  // Non-sensitive literal objects should also be restricted
  t.equal(evaluate('({window: 7}).window'), undefined, 'blocks non-allowlisted property on object literals');

  t.end();
});

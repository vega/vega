var tape = require('tape'),
    vega = require('../');

tape('Parser parses static signals', function(test) {
  var scope = new vega.Scope();

  vega.signal({name: 'a', value: 'foo'}, scope);
  vega.signal({name: 'b', value: 'bar', react: true}, scope);
  vega.signal({name: 'c', value: 'baz', react: false}, scope);

  test.equal(scope.operators.length, 3);
  test.equal(Object.keys(scope.signals).length, 3);
  test.equal(scope.signals.a.value, 'foo');
  test.equal(scope.signals.b.value, 'bar');
  test.equal(scope.signals.c.value, 'baz');
  test.equal(scope.signals.a.react, undefined);
  test.equal(scope.signals.b.react, undefined);
  test.equal(scope.signals.c.react, false);

  test.end();
});

tape('Parser parses updating signals', function(test) {
  // update: {expr: 'expr'} | {value: null} | {signal: 'name'},
  test.end();
});

tape('Parser parses signals with event-driven updates', function(test) {
  var scope = new vega.Scope(),
      update, a, b, c, d;

  scope.addSignal('a', 1);

  // single event stream, constant update value, force true
  vega.signal({
    name: 'b',
    value: 2,
    on: [
      {
        events: {source: 'window', type: 'mouseover'},
        update: {value: 4},
        force: true
      }
    ]
  }, scope);

  // event stream array, expression update value, force false
  vega.signal({
    name: 'c',
    value: 3,
    on: [
      {
        events: [
          {source: 'window', type: 'mouseover'},
          {source: 'window', type: 'touchstart'},
          {signal: 'a'}
        ],
        update: {expr: '2*2'},
        force: false
      }
    ]
  }, scope);

  // signal update value, selector string
  vega.signal({
    name: 'd',
    value: 4,
    on: [
      {
        events: 'window:mouseover',
        update: {signal: 'c'}
      }
    ]
  }, scope);

  test.equal(Object.keys(scope.signals).length, 4);
  test.equal(a = scope.signals.a.id, 0);
  test.equal(b = scope.signals.b.id, 1);
  test.equal(c = scope.signals.c.id, 3);
  test.equal(d = scope.signals.d.id, 6);
  test.equal(scope.signals.a.value, 1);
  test.equal(scope.signals.b.value, 2);
  test.equal(scope.signals.c.value, 3);
  test.equal(scope.signals.d.value, 4);

  test.equal(scope.updates.length, 4);

  update = scope.updates[0];
  test.equal(update.source, 2);
  test.equal(update.target, b);
  test.equal(update.update, 4);
  test.equal(update.options.force, true);

  update = scope.updates[1];
  test.equal(update.source, a);
  test.equal(update.target, c);
  test.equal(update.update.$expr, 'var datum=event.item&&event.item.datum;return((2*2));');
  test.equal(update.options, undefined);

  update = scope.updates[2];
  test.equal(update.source, 5);
  test.equal(update.target, c);
  test.equal(update.update.$expr, 'var datum=event.item&&event.item.datum;return((2*2));');
  test.equal(update.options, undefined);

  update = scope.updates[3];
  test.equal(update.source, 2);
  test.equal(update.target, d);
  test.equal(update.update.$expr, '_.value');
  test.equal(update.update.$params.value.$ref, c);
  test.equal(update.options, undefined);

  test.end();
});

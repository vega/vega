var tape = require('tape'),
    vega = require('../');

function parseSignal(spec, scope) {
  vega.signal(spec, scope);
  vega.signalUpdates(spec, scope);
}

tape('Parser parses static signals', function(t) {
  var scope = new vega.Scope();

  vega.signal({name: 'a', value: 'foo'}, scope);
  vega.signal({name: 'b', value: 'bar', react: true}, scope);
  vega.signal({name: 'c', value: 'baz', react: false}, scope);

  t.equal(scope.operators.length, 3);
  t.equal(Object.keys(scope.signals).length, 3);
  t.equal(scope.signals.a.value, 'foo');
  t.equal(scope.signals.b.value, 'bar');
  t.equal(scope.signals.c.value, 'baz');
  t.equal(scope.signals.a.react, undefined);
  t.equal(scope.signals.b.react, undefined);
  t.equal(scope.signals.c.react, false);

  t.end();
});

tape('Parser parses updating signals', function(t) {
  // update: {expr: 'expr'} | {value: null} | {signal: 'name'},
  t.end();
});

tape('Parser parses signals with event-driven updates', function(t) {
  var scope = new vega.Scope(),
      update, a, b, c, d;

  scope.addSignal('a', 1);

  // single event stream, constant update value, force true
  parseSignal({
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
  parseSignal({
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
  parseSignal({
    name: 'd',
    value: 4,
    on: [
      {
        events: 'window:mouseover',
        update: {signal: 'c'}
      }
    ]
  }, scope);

  t.equal(Object.keys(scope.signals).length, 4);
  t.equal(a = scope.signals.a.id, 0);
  t.equal(b = scope.signals.b.id, 1);
  t.equal(c = scope.signals.c.id, 3);
  t.equal(d = scope.signals.d.id, 6);
  t.equal(scope.signals.a.value, 1);
  t.equal(scope.signals.b.value, 2);
  t.equal(scope.signals.c.value, 3);
  t.equal(scope.signals.d.value, 4);

  t.equal(scope.updates.length, 4);

  update = scope.updates[0];
  t.equal(update.source, 2);
  t.equal(update.target, b);
  t.equal(update.update, 4);
  t.equal(update.options.force, true);

  update = scope.updates[1];
  t.equal(update.source && update.source.$ref, a);
  t.equal(update.target, c);
  t.equal(update.update.$expr, 'var datum=event.item&&event.item.datum;return((2*2));');
  t.equal(update.options, undefined);

  update = scope.updates[2];
  t.equal(update.source, 5);
  t.equal(update.target, c);
  t.equal(update.update.$expr, 'var datum=event.item&&event.item.datum;return((2*2));');
  t.equal(update.options, undefined);

  update = scope.updates[3];
  t.equal(update.source, 2);
  t.equal(update.target, d);
  t.equal(update.update.$expr, '_.value');
  t.equal(update.update.$params.value.$ref, c);
  t.equal(update.options, undefined);

  t.end();
});

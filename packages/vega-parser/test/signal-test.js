var vega = require('../');

function parseSignal(spec, scope) {
  vega.signal(spec, scope);
  vega.signalUpdates(spec, scope);
}

test('Parser parses static signals', function() {
  var scope = new vega.Scope();

  vega.signal({name: 'a', value: 'foo'}, scope);
  vega.signal({name: 'b', value: 'bar', react: true}, scope);
  vega.signal({name: 'c', value: 'baz', react: false}, scope);

  expect(scope.operators.length).toBe(3);
  expect(Object.keys(scope.signals).length).toBe(3);
  expect(scope.signals.a.value).toBe('foo');
  expect(scope.signals.b.value).toBe('bar');
  expect(scope.signals.c.value).toBe('baz');
  expect(scope.signals.a.react).toBe(undefined);
  expect(scope.signals.b.react).toBe(undefined);
  expect(scope.signals.c.react).toBe(false);
});

test('Parser parses updating signals', function() {});

test('Parser parses signals with event-driven updates', function() {
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

  expect(Object.keys(scope.signals).length).toBe(4);
  expect(a = scope.signals.a.id).toBe(0);
  expect(b = scope.signals.b.id).toBe(1);
  expect(c = scope.signals.c.id).toBe(3);
  expect(d = scope.signals.d.id).toBe(6);
  expect(scope.signals.a.value).toBe(1);
  expect(scope.signals.b.value).toBe(2);
  expect(scope.signals.c.value).toBe(3);
  expect(scope.signals.d.value).toBe(4);

  expect(scope.updates.length).toBe(4);

  update = scope.updates[0];
  expect(update.source).toBe(2);
  expect(update.target).toBe(b);
  expect(update.update).toBe(4);
  expect(update.options.force).toBe(true);

  update = scope.updates[1];
  expect(update.source && update.source.$ref).toBe(a);
  expect(update.target).toBe(c);
  expect(update.update.$expr).toBe('var datum=event.item&&event.item.datum;return((2*2));');
  expect(update.options).toBe(undefined);

  update = scope.updates[2];
  expect(update.source).toBe(5);
  expect(update.target).toBe(c);
  expect(update.update.$expr).toBe('var datum=event.item&&event.item.datum;return((2*2));');
  expect(update.options).toBe(undefined);

  update = scope.updates[3];
  expect(update.source).toBe(2);
  expect(update.target).toBe(d);
  expect(update.update.$expr).toBe('_.value');
  expect(update.update.$params.value.$ref).toBe(c);
  expect(update.options).toBe(undefined);
});

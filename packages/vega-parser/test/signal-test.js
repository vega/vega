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
  test.equal(update.update.$expr, '2*2');
  test.equal(update.options, undefined);

  update = scope.updates[2];
  test.equal(update.source, 5);
  test.equal(update.target, c);
  test.equal(update.update.$expr, '2*2');
  test.equal(update.options, undefined);

  update = scope.updates[3];
  test.equal(update.source, 2);
  test.equal(update.target, d);
  test.equal(update.update.$expr, '_.value');
  test.equal(update.update.$params.value.$ref, c);
  test.equal(update.options, undefined);

  test.end();
});

/*
  var scope = new vega.Scope(),
      dom, view, between, merge, signal, stream;

  scope.addSignal('a', true);
  scope.addSignal('b', true);
  scope.addSignal('c', true);

  var spec1 = {
    events: [
      {
        source: 'window',
        type: 'mouseover'
      }
    ],
    update: {expr: '1'}
  }; | {value: null} | {signal: 'name'},
    force: true | false
  }

  test.end();
});
*/
/*
signals: [
  {
    name: 'foo',
    value: null,
    update: {expr: 'expr'} | {value: null} | {signal: 'name'},
    react: true | false,
    on: [
      {
        events: [
          {
            source: 'css|window',
            type: 'mousemove',
            between: [
              {

              },
              'eventb'
            ],
            filter: 'expr' | ['expr'],
            throttle: 0,
            debounce: 0,
          },
          {
            merge: [
              {source: 'window', type: 'mousedown'},
              {source: 'window', type: 'mouseup'}
            ],
            between / filter / throttle / debounce
          },
          {
            source: 'view', (no source --> view)
            type: 'wheel',
            between: [0,0],
            mark: 'rect', // --> event.item && event.item.mark.marktype === 'rect'
            name: 'name', // --> event.item && event.item.mark.name === 'name'
            filter: 'expr' | ['expr'],
            throttle: 0,
            debounce: 0
          },
          {signal: 'foo'}
        ],
        update: {expr: 'expr'} | {value: null} | {signal: 'name'},
        force: true | false
      }
    ]
  }
]
/*
{ id:0, source:'window', type:'mousemove' },
{ id:1, source:'window', type:'mousedown' },
{ id:2, source:'window', type:'mouseup' },
{ id:3, merge:[1,2] },
{ id:4, stream:0, between:[1,2] },
{ id:5, stream:4, throttle:100 },
{ id:6, stream:4, debounce:100, filter:'event.buttons > 0' }
*/
var vega = require('../');

test('Parser parses stream definitions', function() {
  var scope = new vega.Scope(),
      dom, view, between, merge, nested, timer;

  scope.addSignal('zero', true); // id zero

  dom = vega.stream({
    source:   'window',
    type:     'mousemove',
    filter:   'event.metaKey',
    throttle: 1,
    debounce: 2
  }, scope);

  view = vega.stream({
    type:     'mousedown',
    marktype: 'rect',
    markname: 'foo',
    filter:   'event.shiftKey',
    throttle: 3,
    debounce: 4
  }, scope);

  between = vega.stream({
    source:   'window',
    type:     'mousemove',
    between:  [
      {source: 'view', type: 'mousedown'},
      {source: 'view', type: 'mouseup'}
    ]
  }, scope);

  merge = vega.stream({
    merge: [
      {source: 'view', type: 'mousedown'},
      {source: 'view', type: 'mouseup'}
    ]
  }, scope);

  nested = vega.stream({
    stream: {
      source:   'window',
      type:     'mousemove',
      between:  [
        {source: 'view', type: 'mousedown'},
        {source: 'view', type: 'mouseup'}
      ]
    },
    between:  [
      {source: 'view', type: 'touchstart'},
      {source: 'view', type: 'touchend'}
    ]
  }, scope);

  timer = vega.stream({
    type:     'timer',
    throttle: 500
  }, scope);

  expect(scope.streams.length).toBe(12);

  expect(scope.streams[0]).toEqual({
    id: 1,
    source: 'window',
    type: 'mousemove'
  });

  expect(scope.streams[1]).toEqual({
    id: dom,
    stream: 1,
    filter: 'event.metaKey',
    throttle: 1,
    debounce: 2
  });

  expect(scope.streams[2]).toEqual({
    id: 3,
    source: 'view',
    type: 'mousedown'
  });

  expect(scope.streams[3]).toEqual({
    id: view,
    stream: 3,
    filter: "(event.shiftKey&&((event.item&&(event.item.mark.marktype==='rect'))&&(event.item.mark.name==='foo')))",
    throttle: 3,
    debounce: 4
  });

  expect(scope.streams[4]).toEqual({
    id: 5,
    source: 'view',
    type: 'mouseup'
  });

  expect(scope.streams[5]).toEqual({
    id: between,
    stream: 1,
    between: [3, 5]
  });

  expect(scope.streams[6]).toEqual({
    id: merge,
    merge: [3, 5]
  });

  expect(scope.streams[7]).toEqual({
    id: 8,
    stream: 1,
    between: [3, 5]
  });

  expect(scope.streams[8]).toEqual({
    id: 9,
    source: 'view',
    type: 'touchstart'
  });

  expect(scope.streams[9]).toEqual({
    id: 10,
    source: 'view',
    type: 'touchend'
  });

  expect(scope.streams[10]).toEqual({
    id: nested,
    stream: 8,
    between: [9, 10]
  });

  expect(scope.streams[11]).toEqual({
    id: timer,
    source: 'timer',
    type: 500
  });
});

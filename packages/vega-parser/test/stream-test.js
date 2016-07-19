var tape = require('tape'),
    vega = require('../');

tape('Parser parses stream definitions', function(test) {
  var scope = new vega.Scope(),
      dom, view, between, merge, signal, nested;

  scope.addSignal('drag', true);

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

  signal = vega.stream({
    signal: 'drag'
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

  test.equal(scope.streams.length, 11);

  test.equal(signal, 0);

  test.deepEqual(scope.streams[0], {
    id: 1,
    source: 'window',
    type: 'mousemove'
  });

  test.deepEqual(scope.streams[1], {
    id: dom,
    stream: 1,
    filter: 'event.metaKey',
    throttle: 1,
    debounce: 2
  });

  test.deepEqual(scope.streams[2], {
    id: 3,
    source: 'view',
    type: 'mousedown'
  });

  test.deepEqual(scope.streams[3], {
    id: view,
    stream: 3,
    filter: "(event.shiftKey&&((event.item&&(event.item.mark.marktype==='rect'))&&(event.item.mark.name==='foo')))",
    throttle: 3,
    debounce: 4
  });

  test.deepEqual(scope.streams[4], {
    id: 5,
    source: 'view',
    type: 'mouseup'
  });

  test.deepEqual(scope.streams[5], {
    id: between,
    stream: 1,
    between: [3, 5]
  });

  test.deepEqual(scope.streams[6], {
    id: merge,
    merge: [3, 5]
  });

  test.deepEqual(scope.streams[7], {
    id: 8,
    stream: 1,
    between: [3, 5]
  });

  test.deepEqual(scope.streams[8], {
    id: 9,
    source: 'view',
    type: 'touchstart'
  });

  test.deepEqual(scope.streams[9], {
    id: 10,
    source: 'view',
    type: 'touchend'
  });

  test.deepEqual(scope.streams[10], {
    id: nested,
    stream: 8,
    between: [9, 10]
  });

  test.end();
});

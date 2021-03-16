var tape = require('tape'),
    vega = require('../');

tape('Parser parses stream definitions', t => {
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

  t.equal(scope.streams.length, 12);

  t.deepEqual(scope.streams[0], {
    id: 1,
    source: 'window',
    type: 'mousemove'
  });

  t.deepEqual(scope.streams[1], {
    id: dom,
    stream: 1,
    filter: {code: 'event.metaKey'},
    throttle: 1,
    debounce: 2
  });

  t.deepEqual(scope.streams[2], {
    id: 3,
    source: 'view',
    type: 'mousedown'
  });

  t.deepEqual(scope.streams[3], {
    id: view,
    stream: 3,
    filter: {
      code: "(event.shiftKey&&((event.item&&(event.item.mark.marktype === 'rect'))&&(event.item.mark.name === 'foo')))"
    },
    throttle: 3,
    debounce: 4
  });

  t.deepEqual(scope.streams[4], {
    id: 5,
    source: 'view',
    type: 'mouseup'
  });

  t.deepEqual(scope.streams[5], {
    id: between,
    stream: 1,
    between: [3, 5]
  });

  t.deepEqual(scope.streams[6], {
    id: merge,
    merge: [3, 5]
  });

  t.deepEqual(scope.streams[7], {
    id: 8,
    stream: 1,
    between: [3, 5]
  });

  t.deepEqual(scope.streams[8], {
    id: 9,
    source: 'view',
    type: 'touchstart'
  });

  t.deepEqual(scope.streams[9], {
    id: 10,
    source: 'view',
    type: 'touchend'
  });

  t.deepEqual(scope.streams[10], {
    id: nested,
    stream: 8,
    between: [9, 10]
  });

  t.deepEqual(scope.streams[11], {
    id: timer,
    source: 'timer',
    type: 500
  });

  t.end();
});

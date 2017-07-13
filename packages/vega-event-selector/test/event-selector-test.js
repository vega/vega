var tape = require('tape'),
    vega = require('../');

tape('Parser parses event selector strings', function(test) {
  var events;

  events = vega.selector('rect:mousedown');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect'
  });

  events = vega.selector('rect:mousedown, rect:touchstart');
  test.equal(events.length, 2);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect'
  });
  test.deepEqual(events[1], {
    source: 'view',
    type: 'touchstart',
    marktype: 'rect'
  });

  events = vega.selector('rect:mousedown!');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    consume: true
  });

  events = vega.selector('@foo:mouseup');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mouseup',
    markname: 'foo'
  });

  events = vega.selector('rect:mousedown{1000}');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 1000
  });

  events = vega.selector('rect:mousedown{100,200}');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 100,
    debounce: 200
  });

  events = vega.selector('rect:mousedown{0,200}');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    debounce: 200
  });

  events = vega.selector('rect:mousedown{,200}');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    debounce: 200
  });

  events = vega.selector('rect:mousedown{200,0}');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 200
  });

  events = vega.selector('rect:mousedown{200,}');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 200
  });

  events = vega.selector('mousedown[event.x>10][event.metaKey]');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    filter: ['event.x>10', 'event.metaKey']
  });

  events = vega.selector('wheel![event.shiftKey]');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'wheel',
    consume: true,
    filter: ['event.shiftKey']
  });

  events = vega.selector('wheel![event.shiftKey]{200}');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'wheel',
    consume: true,
    filter: ['event.shiftKey'],
    throttle: 200
  });

  events = vega.selector('path:wheel![event.shiftKey]{200}');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'view',
    type: 'wheel',
    marktype: 'path',
    consume: true,
    filter: ['event.shiftKey'],
    throttle: 200
  });

  events = vega.selector('[mousedown, mouseup] > window:mousemove');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'window',
    type: 'mousemove',
    between: [
      {source: 'view', type: 'mousedown'},
      {source: 'view', type: 'mouseup'}
    ]
  });

  events = vega.selector('[touchstart, touchend] > [mousedown, mouseup] > window:mousemove');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    between: [
      {source: 'view', type: 'touchstart'},
      {source: 'view', type: 'touchend'}
    ],
    stream: {
      source: 'window',
      type: 'mousemove',
      between: [
        {source: 'view', type: 'mousedown'},
        {source: 'view', type: 'mouseup'}
      ]
    }
  });

  events = vega.selector('[mousedown[!event.item], window:mouseup] > window:mousemove');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'window',
    type: 'mousemove',
    between: [
      {source: 'view', type: 'mousedown', filter: ['!event.item']},
      {source: 'window', type: 'mouseup'}
    ]
  });

  test.end();
});

tape('Parser allows configurable source', function(test) {
  var events = vega.selector('rect:mousedown', 'scope');
  test.equal(events.length, 1);
  test.deepEqual(events[0], {
    source: 'scope',
    type: 'mousedown',
    marktype: 'rect'
  });
  test.end();
});

tape('Parser rejects invalid event selector strings', function(test) {
  test.throws(function() { vega.selector(''); });
  test.throws(function() { vega.selector('foo{}'); });
  test.throws(function() { vega.selector('foo{a}'); });
  test.throws(function() { vega.selector('foo{1,2,3}'); });

  test.throws(function() { vega.selector('{foo'); });
  test.throws(function() { vega.selector('}foo'); });
  test.throws(function() { vega.selector('foo{'); });
  test.throws(function() { vega.selector('foo}'); });
  test.throws(function() { vega.selector('foo{1'); });
  test.throws(function() { vega.selector('foo}1'); });
  test.throws(function() { vega.selector('foo{1}a'); });
  test.throws(function() { vega.selector('{}'); });
  test.throws(function() { vega.selector('{1}'); });
  test.throws(function() { vega.selector('{1}a'); });

  test.throws(function() { vega.selector('[foo'); });
  test.throws(function() { vega.selector(']foo'); });
  test.throws(function() { vega.selector('foo['); });
  test.throws(function() { vega.selector('foo]'); });
  test.throws(function() { vega.selector('foo[1'); });
  test.throws(function() { vega.selector('foo]1'); });
  test.throws(function() { vega.selector('foo[1]a'); });

  test.throws(function() { vega.selector('[]'); });
  test.throws(function() { vega.selector('[a]'); });
  test.throws(function() { vega.selector('[a,b]'); });
  test.throws(function() { vega.selector('[a,b] >'); });

  test.end();
});

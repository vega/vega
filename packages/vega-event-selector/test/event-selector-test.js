var vega = require('../');

test('Parser parses event selector strings', function() {
  var events;

  events = vega.selector('rect:mousedown');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    marktype: 'rect'
  });

  events = vega.selector('rect:mousedown, rect:touchstart');
  expect(events.length).toBe(2);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    marktype: 'rect'
  });
  expect(events[1]).toEqual({
    source: 'view',
    type: 'touchstart',
    marktype: 'rect'
  });

  events = vega.selector('rect:mousedown!');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    consume: true
  });

  events = vega.selector('@foo:mouseup');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mouseup',
    markname: 'foo'
  });

  events = vega.selector('rect:mousedown{1000}');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 1000
  });

  events = vega.selector('rect:mousedown{100,200}');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 100,
    debounce: 200
  });

  events = vega.selector('rect:mousedown{0,200}');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    debounce: 200
  });

  events = vega.selector('rect:mousedown{,200}');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    debounce: 200
  });

  events = vega.selector('rect:mousedown{200,0}');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 200
  });

  events = vega.selector('rect:mousedown{200,}');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 200
  });

  events = vega.selector('mousedown[event.x>10][event.metaKey]');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'mousedown',
    filter: ['event.x>10', 'event.metaKey']
  });

  events = vega.selector('wheel![event.shiftKey]');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'wheel',
    consume: true,
    filter: ['event.shiftKey']
  });

  events = vega.selector('wheel![event.shiftKey]{200}');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'wheel',
    consume: true,
    filter: ['event.shiftKey'],
    throttle: 200
  });

  events = vega.selector('path:wheel![event.shiftKey]{200}');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'view',
    type: 'wheel',
    marktype: 'path',
    consume: true,
    filter: ['event.shiftKey'],
    throttle: 200
  });

  events = vega.selector('[mousedown, mouseup] > window:mousemove');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'window',
    type: 'mousemove',
    between: [
      {source: 'view', type: 'mousedown'},
      {source: 'view', type: 'mouseup'}
    ]
  });

  events = vega.selector('[touchstart, touchend] > [mousedown, mouseup] > window:mousemove');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
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
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'window',
    type: 'mousemove',
    between: [
      {source: 'view', type: 'mousedown', filter: ['!event.item']},
      {source: 'window', type: 'mouseup'}
    ]
  });
});

test('Parser allows configurable source', function() {
  var events = vega.selector('rect:mousedown', 'scope');
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    source: 'scope',
    type: 'mousedown',
    marktype: 'rect'
  });
});

test('Parser rejects invalid event selector strings', function() {
  expect(function() { vega.selector(''); }).toThrow();
  expect(function() { vega.selector('foo{}'); }).toThrow();
  expect(function() { vega.selector('foo{a}'); }).toThrow();
  expect(function() { vega.selector('foo{1,2,3}'); }).toThrow();

  expect(function() { vega.selector('{foo'); }).toThrow();
  expect(function() { vega.selector('}foo'); }).toThrow();
  expect(function() { vega.selector('foo{'); }).toThrow();
  expect(function() { vega.selector('foo}'); }).toThrow();
  expect(function() { vega.selector('foo{1'); }).toThrow();
  expect(function() { vega.selector('foo}1'); }).toThrow();
  expect(function() { vega.selector('foo{1}a'); }).toThrow();
  expect(function() { vega.selector('{}'); }).toThrow();
  expect(function() { vega.selector('{1}'); }).toThrow();
  expect(function() { vega.selector('{1}a'); }).toThrow();

  expect(function() { vega.selector('[foo'); }).toThrow();
  expect(function() { vega.selector(']foo'); }).toThrow();
  expect(function() { vega.selector('foo['); }).toThrow();
  expect(function() { vega.selector('foo]'); }).toThrow();
  expect(function() { vega.selector('foo[1'); }).toThrow();
  expect(function() { vega.selector('foo]1'); }).toThrow();
  expect(function() { vega.selector('foo[1]a'); }).toThrow();

  expect(function() { vega.selector('[]'); }).toThrow();
  expect(function() { vega.selector('[a]'); }).toThrow();
  expect(function() { vega.selector('[a,b]'); }).toThrow();
  expect(function() { vega.selector('[a,b] >'); }).toThrow();
});

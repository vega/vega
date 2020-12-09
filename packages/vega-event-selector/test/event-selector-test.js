var tape = require('tape'),
    vega = require('../');

tape('Parser parses event selector strings', t => {
  let events;

  events = vega.selector('rect:mousedown');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect'
  });

  events = vega.selector('rect:mousedown, rect:touchstart');
  t.equal(events.length, 2);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect'
  });
  t.deepEqual(events[1], {
    source: 'view',
    type: 'touchstart',
    marktype: 'rect'
  });

  events = vega.selector('rect:mousedown!');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    consume: true
  });

  events = vega.selector('@foo:mouseup');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mouseup',
    markname: 'foo'
  });

  events = vega.selector('rect:mousedown{1000}');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 1000
  });

  events = vega.selector('rect:mousedown{100,200}');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 100,
    debounce: 200
  });

  events = vega.selector('rect:mousedown{0,200}');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    debounce: 200
  });

  events = vega.selector('rect:mousedown{,200}');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    debounce: 200
  });

  events = vega.selector('rect:mousedown{200,0}');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 200
  });

  events = vega.selector('rect:mousedown{200,}');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    marktype: 'rect',
    throttle: 200
  });

  events = vega.selector('mousedown[event.x>10][event.metaKey]');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'mousedown',
    filter: ['event.x>10', 'event.metaKey']
  });

  events = vega.selector('wheel![event.shiftKey]');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'wheel',
    consume: true,
    filter: ['event.shiftKey']
  });

  events = vega.selector('wheel![event.shiftKey]{200}');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'wheel',
    consume: true,
    filter: ['event.shiftKey'],
    throttle: 200
  });

  events = vega.selector('path:wheel![event.shiftKey]{200}');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'view',
    type: 'wheel',
    marktype: 'path',
    consume: true,
    filter: ['event.shiftKey'],
    throttle: 200
  });

  events = vega.selector('[mousedown, mouseup] > window:mousemove');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'window',
    type: 'mousemove',
    between: [
      {source: 'view', type: 'mousedown'},
      {source: 'view', type: 'mouseup'}
    ]
  });

  events = vega.selector('[touchstart, touchend] > [mousedown, mouseup] > window:mousemove');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
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
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'window',
    type: 'mousemove',
    between: [
      {source: 'view', type: 'mousedown', filter: ['!event.item']},
      {source: 'window', type: 'mouseup'}
    ]
  });

  t.end();
});

tape('Parser allows configurable source', t => {
  const events = vega.selector('rect:mousedown', 'scope');
  t.equal(events.length, 1);
  t.deepEqual(events[0], {
    source: 'scope',
    type: 'mousedown',
    marktype: 'rect'
  });
  t.end();
});

tape('Parser rejects invalid event selector strings', t => {
  t.throws(() => { vega.selector(''); });
  t.throws(() => { vega.selector('foo{}'); });
  t.throws(() => { vega.selector('foo{a}'); });
  t.throws(() => { vega.selector('foo{1,2,3}'); });

  t.throws(() => { vega.selector('{foo'); });
  t.throws(() => { vega.selector('}foo'); });
  t.throws(() => { vega.selector('foo{'); });
  t.throws(() => { vega.selector('foo}'); });
  t.throws(() => { vega.selector('foo{1'); });
  t.throws(() => { vega.selector('foo}1'); });
  t.throws(() => { vega.selector('foo{1}a'); });
  t.throws(() => { vega.selector('{}'); });
  t.throws(() => { vega.selector('{1}'); });
  t.throws(() => { vega.selector('{1}a'); });

  t.throws(() => { vega.selector('[foo'); });
  t.throws(() => { vega.selector(']foo'); });
  t.throws(() => { vega.selector('foo['); });
  t.throws(() => { vega.selector('foo]'); });
  t.throws(() => { vega.selector('foo[1'); });
  t.throws(() => { vega.selector('foo]1'); });
  t.throws(() => { vega.selector('foo[1]a'); });

  t.throws(() => { vega.selector('[]'); });
  t.throws(() => { vega.selector('[a]'); });
  t.throws(() => { vega.selector('[a,b]'); });
  t.throws(() => { vega.selector('[a,b] >'); });

  t.end();
});

var tape = require('tape'),
    vega = require('vega-dataflow'),
    runtime = require('../'),
    events = require('./events');

tape('Parser parses event streams', t => {

  const spec = {
    streams: [
      { id:0, source:'window', type:'mousemove' },
      { id:1, source:'window', type:'mousedown' },
      { id:2, source:'window', type:'mouseup' },
      { id:3, merge:[1,2] },
      { id:4, stream:0, between:[1,2] },
      { id:5, stream:4, throttle:100 },
      { id:6, stream:4, debounce:100, filter: {code:'event.buttons > 0'} }
    ]
  };

  const df = new vega.Dataflow();
  df.events = events.events;
  df.fire = events.fire;

  var ctx = runtime.context(df, {}).parse(spec),
      streams = ctx.nodes,
      counts = [0,0,0,0,0,0,0];

  Object.keys(streams).forEach((id, i) => {
    streams[id].apply(() => { counts[i] += 1; });
  });

  t.deepEqual(counts, [0,0,0,0,0,0,0]);

  df.fire('window', 'mousemove', {});
  t.deepEqual(counts, [1,0,0,0,0,0,0]);

  df.fire('window', 'mousedown', {});
  t.deepEqual(counts, [1,1,0,1,0,0,0]);

  df.fire('window', 'mouseup', {});
  t.deepEqual(counts, [1,1,1,2,0,0,0]);

  df.fire('window', 'mousedown', {});
  df.fire('window', 'mousemove', {});
  df.fire('window', 'mousemove', {});
  df.fire('window', 'mouseup', {});
  t.deepEqual(counts, [3,2,2,4,2,1,0]);

  df.fire('window', 'mousedown', {});
  df.fire('window', 'mousemove', {buttons: 1});
  df.fire('window', 'mouseup', {});

  setTimeout(() => {
    t.deepEqual(counts, [4,3,3,6,3,1,1]);
    t.end();
  }, 105);
});

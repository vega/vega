var tape = require('tape'),
    vega = require('vega-dataflow'),
    dataflow = require('../').dataflow,
    events = require('./events');

tape('Parser parses event streams', function(test) {

  var spec = {
    streams: [
      { id:0, source:'window', type:'mousemove' },
      { id:1, source:'window', type:'mousedown' },
      { id:2, source:'window', type:'mouseup' },
      { id:3, merge:[1,2] },
      { id:4, stream:0, between:[1,2] },
      { id:5, stream:4, throttle:100 },
      { id:6, stream:4, debounce:100, filter:'event.buttons > 0' }
    ]
  };

  var df = new vega.Dataflow();
  df.events = events.events;

  var ctx = dataflow(spec, df).context,
      streams = ctx.streams,
      counts = [0,0,0,0,0,0,0];

  Object.keys(streams).forEach(function(id, i) {
    streams[id].apply(function() { counts[i] += 1; });
  });

  test.deepEqual(counts, [0,0,0,0,0,0,0]);

  events.fire('window', 'mousemove', {});
  test.deepEqual(counts, [1,0,0,0,0,0,0]);

  events.fire('window', 'mousedown', {});
  test.deepEqual(counts, [1,1,0,1,0,0,0]);

  events.fire('window', 'mouseup', {});
  test.deepEqual(counts, [1,1,1,2,0,0,0]);

  events.fire('window', 'mousedown', {});
  events.fire('window', 'mousemove', {});
  events.fire('window', 'mousemove', {});
  events.fire('window', 'mouseup', {});
  test.deepEqual(counts, [3,2,2,4,2,1,0]);

  events.fire('window', 'mousedown', {});
  events.fire('window', 'mousemove', {buttons: 1});
  events.fire('window', 'mouseup', {});

  setTimeout(function() {
    test.deepEqual(counts, [4,3,3,6,3,1,1]);
    test.end();
  }, 105);
});

var vega = require('vega-dataflow'), runtime = require('../'), events = require('./events');

test('Parser parses event streams', function(done) {

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
  df.fire = events.fire;

  var ctx = runtime.parse(spec, runtime.context(df, {})),
      streams = ctx.nodes,
      counts = [0,0,0,0,0,0,0];

  Object.keys(streams).forEach(function(id, i) {
    streams[id].apply(function() { counts[i] += 1; });
  });

  expect(counts).toEqual([0,0,0,0,0,0,0]);

  df.fire('window', 'mousemove', {});
  expect(counts).toEqual([1,0,0,0,0,0,0]);

  df.fire('window', 'mousedown', {});
  expect(counts).toEqual([1,1,0,1,0,0,0]);

  df.fire('window', 'mouseup', {});
  expect(counts).toEqual([1,1,1,2,0,0,0]);

  df.fire('window', 'mousedown', {});
  df.fire('window', 'mousemove', {});
  df.fire('window', 'mousemove', {});
  df.fire('window', 'mouseup', {});
  expect(counts).toEqual([3,2,2,4,2,1,0]);

  df.fire('window', 'mousedown', {});
  df.fire('window', 'mousemove', {buttons: 1});
  df.fire('window', 'mouseup', {});

  setTimeout(function() {
    expect(counts).toEqual([4,3,3,6,3,1,1]);
    done();
  }, 105);
});

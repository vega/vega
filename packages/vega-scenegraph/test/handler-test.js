var tape = require('tape'),
    vega = require('../'),
    Handler = vega.Handler;

function padding(l,t,r,b) {
  return {left: l, top: t, right: r, bottom: b};
}

tape('Handler should support argument free constructor', function(test) {
  var h = new Handler();
  test.equal(h._active, null);
  test.ok(h._handlers);
  test.end();
});

tape('Handler should initialize', function(test) {
  var el = {};
  var obj = {};
  var pad = padding(1, 1, 1, 1);
  var h = new Handler();
  var s = h.initialize(el, pad, obj);
  test.equal(s, h);
  test.equal(h._el, el);
  test.equal(h._obj, obj);
  test.deepEqual(h._padding, pad);

  h.initialize(el, pad);
  test.equal(h._obj, null);
  test.equal(h.on(), undefined);
  test.equal(h.off(), undefined);
  test.end();
});

tape('Handler should parse event names', function(test) {
  var h = new Handler();
  test.equal(h.eventName('touchstart'), 'touchstart');
  test.equal(h.eventName('click.foo'), 'click');
  test.end();
});

tape('Handler should return array of handlers', function(test) {
  var obj = {}
  var h = new Handler();
  test.deepEqual(h.handlers(), []);
  h._handlers = {'click':[obj]};
  h = h.handlers();
  test.equal(h && h.length, 1);
  test.equal(h[0], obj);
  test.end();
});

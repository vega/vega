var tape = require('tape'),
    vega = require('../'),
    Handler = vega.Handler;

tape('Handler should support argument free constructor', function(t) {
  var h = new Handler();
  t.equal(h._active, null);
  t.ok(h._handlers);
  t.end();
});

tape('Handler should initialize', function(t) {
  var el = {};
  var obj = {};
  var o = [1, 1];
  var h = new Handler();
  var s = h.initialize(el, o, obj);
  t.equal(s, h);
  t.equal(h._el, el);
  t.equal(h._obj, obj);
  t.deepEqual(h._origin, o);

  h.initialize(el, o);
  t.equal(h._obj, null);
  t.equal(h.on(), undefined);
  t.equal(h.off(), undefined);
  t.end();
});

tape('Handler should parse event names', function(t) {
  var h = new Handler();
  t.equal(h.eventName('touchstart'), 'touchstart');
  t.equal(h.eventName('click.foo'), 'click');
  t.end();
});

tape('Handler should return array of handlers', function(t) {
  var obj = {};
  var h = new Handler();
  t.deepEqual(h.handlers(), []);
  h._handlers = {'click':[obj]};
  h = h.handlers();
  t.equal(h && h.length, 1);
  t.equal(h[0], obj);
  t.end();
});

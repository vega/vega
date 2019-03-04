var vega = require('../'), Handler = vega.Handler;

test('Handler should support argument free constructor', function() {
  var h = new Handler();
  expect(h._active).toBe(null);
  expect(h._handlers).toBeTruthy();
});

test('Handler should initialize', function() {
  var el = {};
  var obj = {};
  var o = [1, 1];
  var h = new Handler();
  var s = h.initialize(el, o, obj);
  expect(s).toBe(h);
  expect(h._el).toBe(el);
  expect(h._obj).toBe(obj);
  expect(h._origin).toEqual(o);

  h.initialize(el, o);
  expect(h._obj).toBe(null);
  expect(h.on()).toBe(undefined);
  expect(h.off()).toBe(undefined);
});

test('Handler should parse event names', function() {
  var h = new Handler();
  expect(h.eventName('touchstart')).toBe('touchstart');
  expect(h.eventName('click.foo')).toBe('click');
});

test('Handler should return array of handlers', function() {
  var obj = {};
  var h = new Handler();
  expect(h.handlers()).toEqual([]);
  h._handlers = {'click':[obj]};
  h = h.handlers();
  expect(h && h.length).toBe(1);
  expect(h[0]).toBe(obj);
});

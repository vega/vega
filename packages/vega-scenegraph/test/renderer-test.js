var vega = require('../'), Renderer = vega.Renderer;

test('Renderer should support argument free constructor', function() {
  var r = new Renderer();
  expect(r._el).toBe(null);
  expect(r._bgcolor).toBe(null);
});

test('Renderer should initialize', function() {
  var el = {};
  var o = [1, 1];
  var r = new Renderer();
  var s = r.initialize(el, 1, 2, o);
  expect(s).toBe(r);
  expect(r._el).toBe(el);
  expect(r.element()).toBe(el);
  expect(r._width).toBe(1);
  expect(r._height).toBe(2);
  expect(r._origin).toEqual(o);
});

test('Renderer should resize', function() {
  var o = [10, 10];
  var r = new Renderer();
  var s = r.resize(100, 200, o);
  expect(s).toBe(r);
  expect(r._width).toBe(100);
  expect(r._height).toBe(200);
  expect(r._origin).toEqual(o);
});

test('Renderer should set background color', function() {
  var r = new Renderer();
  var s = r.background('steelblue');
  expect(s).toBe(r);
  expect(r._bgcolor).toBe('steelblue');
});

test('Renderer should use zero-padding if none is provided', function() {
  var r = new Renderer().resize(100, 200, null);
  expect(r._origin).toEqual([0, 0]);
});

test('Renderer should return self from render method', function() {
  var r = new Renderer();
  var s = r.render();
  expect(s).toBe(r);
});

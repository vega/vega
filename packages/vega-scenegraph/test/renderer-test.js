var tape = require('tape'),
    vega = require('../'),
    Renderer = vega.Renderer;

tape('Renderer should support argument free constructor', function(test) {
  var r = new Renderer();
  test.equal(r._el, null);
  test.equal(r._bgcolor, null);
  test.end();
});

tape('Renderer should initialize', function(test) {
  var el = {};
  var o = [1, 1];
  var r = new Renderer();
  var s = r.initialize(el, 1, 2, o);
  test.equal(s, r);
  test.equal(r._el, el);
  test.equal(r.element(), el);
  test.equal(r._width, 1);
  test.equal(r._height, 2);
  test.deepEqual(r._origin, o);
  test.end();
});

tape('Renderer should resize', function(test) {
  var o = [10, 10];
  var r = new Renderer();
  var s = r.resize(100, 200, o);
  test.equal(s, r);
  test.equal(r._width, 100);
  test.equal(r._height, 200);
  test.deepEqual(r._origin, o);
  test.end();
});

tape('Renderer should set background color', function(test) {
  var r = new Renderer();
  var s = r.background('steelblue');
  test.equal(s, r);
  test.equal(r._bgcolor, 'steelblue');
  test.end();
});

tape('Renderer should use zero-padding if none is provided', function(test) {
  var r = new Renderer().resize(100, 200, null);
  test.deepEqual(r._origin, [0, 0]);
  test.end();
});

tape('Renderer should return self from render method', function(test) {
  var r = new Renderer();
  var s = r.render();
  test.equal(s, r);
  test.end();
});

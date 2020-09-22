var tape = require('tape'),
    vega = require('../'),
    Renderer = vega.Renderer;

tape('Renderer should support argument free constructor', t => {
  const r = new Renderer();
  t.equal(r._el, null);
  t.equal(r._bgcolor, null);
  t.end();
});

tape('Renderer should initialize', t => {
  const el = {};
  const o = [1, 1];
  const r = new Renderer();
  const s = r.initialize(el, 1, 2, o);
  t.equal(s, r);
  t.equal(r._el, el);
  t.equal(r.element(), el);
  t.equal(r._width, 1);
  t.equal(r._height, 2);
  t.deepEqual(r._origin, o);
  t.end();
});

tape('Renderer should resize', t => {
  const o = [10, 10];
  const r = new Renderer();
  const s = r.resize(100, 200, o);
  t.equal(s, r);
  t.equal(r._width, 100);
  t.equal(r._height, 200);
  t.deepEqual(r._origin, o);
  t.end();
});

tape('Renderer should set background color', t => {
  const r = new Renderer();
  const s = r.background('steelblue');
  t.equal(s, r);
  t.equal(r._bgcolor, 'steelblue');
  t.end();
});

tape('Renderer should use zero-padding if none is provided', t => {
  const r = new Renderer().resize(100, 200, null);
  t.deepEqual(r._origin, [0, 0]);
  t.end();
});

tape('Renderer should return self from render method', t => {
  const r = new Renderer();
  const s = r.render();
  t.equal(s, r);
  t.end();
});

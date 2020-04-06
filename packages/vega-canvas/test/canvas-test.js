const tape = require('tape');
const vega = require('../');
const canvas = require('canvas');

tape('Canvas loader loads node canvas', function (t) {
  let c = vega.canvas(10, 20);
  t.ok(c);
  t.ok(c.getContext);
  t.equal(c.width, 10);
  t.equal(c.height, 20);
  t.equal(vega.image(), canvas.Image);

  c = vega.canvas();
  t.equal(c.width, 0);
  t.equal(c.height, 0);

  t.end();
});

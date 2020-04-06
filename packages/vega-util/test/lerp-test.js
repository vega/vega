const tape = require('tape');
const vega = require('../');

tape('lerp linearly interpolates numbers', function (t) {
  const a = [0, 100];
  const b = [100, 0];

  // invalid fraction values
  t.equal(vega.lerp(a, null), 0);
  t.equal(vega.lerp(a, undefined), 0);
  t.equal(vega.lerp(a, NaN), 0);

  // increasing array values
  t.equal(vega.lerp(a, 0.0), 0);
  t.equal(vega.lerp(a, 0.01), 1);
  t.equal(vega.lerp(a, 0.2), 20);
  t.equal(vega.lerp(a, 0.5), 50);
  t.equal(vega.lerp(a, 0.8), 80);
  t.equal(vega.lerp(a, 0.99), 99);
  t.equal(vega.lerp(a, 1.0), 100);
  t.equal(vega.lerp(a, -1), -100);
  t.equal(vega.lerp(a, 2), 200);

  // decreasing array values
  t.equal(vega.lerp(b, 0.0), 100);
  t.equal(vega.lerp(b, 0.01), 99);
  t.equal(vega.lerp(b, 0.2), 80);
  t.equal(vega.lerp(b, 0.5), 50);
  t.equal(vega.lerp(b, 0.8), 20);
  t.equal(vega.lerp(b, 0.99), 1);
  t.equal(vega.lerp(b, 1.0), 0);
  t.equal(vega.lerp(b, -1), 200);
  t.equal(vega.lerp(b, 2), -100);

  t.end();
});

var tape = require('tape'),
    vega = require('../');

tape('lerp linearly interpolates numbers', t => {
  const a = [0, 100],
        b = [100, 0];

  // invalid fraction values
  t.equal(vega.lerp(a, null), 0);
  t.equal(vega.lerp(a, undefined), 0);
  t.equal(vega.lerp(a, NaN), 0);

  // increasing array values
  t.equal(vega.lerp(a, 0.00),   0);
  t.equal(vega.lerp(a, 0.01),   1);
  t.equal(vega.lerp(a, 0.20),  20);
  t.equal(vega.lerp(a, 0.50),  50);
  t.equal(vega.lerp(a, 0.80),  80);
  t.equal(vega.lerp(a, 0.99),  99);
  t.equal(vega.lerp(a, 1.00), 100);
  t.equal(vega.lerp(a, -1), -100);
  t.equal(vega.lerp(a,  2),  200);

  // decreasing array values
  t.equal(vega.lerp(b, 0.00), 100);
  t.equal(vega.lerp(b, 0.01),  99);
  t.equal(vega.lerp(b, 0.20),  80);
  t.equal(vega.lerp(b, 0.50),  50);
  t.equal(vega.lerp(b, 0.80),  20);
  t.equal(vega.lerp(b, 0.99),   1);
  t.equal(vega.lerp(b, 1.00),   0);
  t.equal(vega.lerp(b, -1),  200);
  t.equal(vega.lerp(b,  2), -100);

  t.end();
});

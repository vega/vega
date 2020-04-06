const tape = require('tape');
const sampleCurve = require('../').sampleCurve;

function matches(t, v, x, f) {
  t.deepEqual(v, [x, f(x)]);
}

tape('sampleCurve adaptively samples a linear curve', function (t) {
  const f = x => 2 - x;
  const e = [0, 2];
  let c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  // sample with default parameters
  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  t.end();
});

tape('sampleCurve adaptively samples a quadratic curve', function (t) {
  const f = x => 1 + x * x;
  const e = [0, 5];
  let c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  // sample with default parameters
  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  t.end();
});

tape('sampleCurve adaptively samples an exponential curve', function (t) {
  const f = x => Math.exp(x);
  const e = [0, 5];
  let c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  t.end();
});

tape('sampleCurve adaptively samples a sinusoidal curve', function (t) {
  const f = x => Math.sin(2 * Math.PI * x);
  const e = [0, 2];
  let c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  t.end();
});

tape('sampleCurve adaptively samples a polynomial curve', function (t) {
  const f = x => -2 * x * x * x * x + 5 * x * x * x - 4 * x * x + 10 * x - 5;
  const e = [0, 5];
  let c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length - 1], e[1], f);

  t.end();
});

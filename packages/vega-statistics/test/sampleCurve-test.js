var tape = require('tape'),
    sampleCurve = require('../').sampleCurve;

function matches(t, v, x, f) {
  t.deepEqual(v, [x, f(x)]);
}

tape('sampleCurve adaptively samples a linear curve', t => {
  var f = x => 2 - x,
      e = [0, 2], c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  // sample with default parameters
  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  t.end();
});

tape('sampleCurve adaptively samples a quadratic curve', t => {
  var f = x => 1 + x * x,
      e = [0, 5], c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  // sample with default parameters
  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  t.end();
});

tape('sampleCurve adaptively samples an exponential curve', t => {
  var f = x => Math.exp(x),
      e = [0, 5], c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  t.end();
});

tape('sampleCurve adaptively samples a sinusoidal curve', t => {
  var f = x => Math.sin(2 * Math.PI * x),
      e = [0, 2], c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  t.end();
});

tape('sampleCurve adaptively samples a polynomial curve', t => {
  var f = x => -2*x*x*x*x + 5*x*x*x - 4*x*x + 10*x - 5,
      e = [0, 5], c;

  // constrain to start and end
  c = sampleCurve(f, e, 1, 1);
  t.equal(c.length, 2);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  c = sampleCurve(f, e, 20, 100);
  t.ok(c.length >= 20 && c.length <= 101);
  matches(t, c[0], e[0], f);
  matches(t, c[c.length-1], e[1], f);

  t.end();
});

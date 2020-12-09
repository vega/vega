var tape = require('tape'),
    uniform = require('../').randomUniform;

tape('uniform generates random values', t => {
  let s = uniform().sample();
  t.ok(s >= 0 && s < 1);

  s = uniform(10).sample();
  t.ok(s >= 0 && s < 10);

  s = uniform(5, 10).sample();
  t.ok(s >= 5 && s < 10);

  t.end();
});

tape('uniform evaluates the pdf', t => {
  const n1 = uniform(-1, 1);
  t.equal(n1.pdf(-2), 0.0);
  t.equal(n1.pdf(2), 0.0);
  t.equal(n1.pdf(0), 0.5);
  t.equal(n1.pdf(-0.5), n1.pdf(0.5));
  t.equal(n1.pdf(-1), n1.pdf(1));
  t.end();
});

tape('uniform evaluates the cdf', t => {
  const n1 = uniform(-1, 1);
  // extreme values
  t.equal(n1.cdf(-2), 0);
  t.equal(n1.cdf(2), 1);
  // in range values
  t.equal(n1.cdf(0), 0.50);
  t.equal(n1.cdf(-0.5), 0.25);
  t.equal(n1.cdf(0.5), 0.75);
  t.end();
});

tape('uniform evaluates the inverse cdf', t => {
  const n1 = uniform(-1, 1);
  // extreme values
  t.ok(Number.isNaN(n1.icdf(-2)));
  t.ok(Number.isNaN(n1.icdf(2)));
  t.equal(n1.icdf(0), -1);
  t.equal(n1.icdf(1), 1);
  // in range values
  t.equal(n1.icdf(0.5), 0);
  t.equal(n1.icdf(0.25), -0.5);
  t.equal(n1.icdf(0.75), 0.5);
  t.end();
});

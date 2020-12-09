var tape = require('tape'),
    integer = require('../').randomInteger;

tape('integer generates random values', t => {
  let s = integer(10).sample();
  t.ok(0 <= s && s < 10);
  t.equal(s, ~~s);

  s = integer(5, 10).sample();
  t.ok(5 <= s && s < 10);
  t.equal(s, ~~s);

  t.end();
});

tape('integer evaluates the pdf', t => {
  const n1 = integer(0, 5);
  t.equal(n1.pdf(-1), 0.0);
  t.equal(n1.pdf(5), 0.0);
  t.equal(n1.pdf(0), 0.2);
  t.equal(n1.pdf(1), 0.2);
  t.equal(n1.pdf(2), 0.2);
  t.equal(n1.pdf(3), 0.2);
  t.equal(n1.pdf(4), 0.2);
  t.end();
});

tape('integer evaluates the cdf', t => {
  const n1 = integer(0, 5);
  t.equal(n1.cdf(-1), 0.0);
  t.equal(n1.cdf(0), 0.2);
  t.equal(n1.cdf(1), 0.4);
  t.equal(n1.cdf(2), 0.6);
  t.equal(n1.cdf(3), 0.8);
  t.equal(n1.cdf(4), 1.0);
  t.equal(n1.cdf(5), 1.0);
  t.end();
});

tape('integer evaluates the inverse cdf', t => {
  const n1 = integer(0, 5);
  // extreme values
  t.ok(Number.isNaN(n1.icdf(-1)));
  t.ok(Number.isNaN(n1.icdf(2)));
  // in range values
  t.equal(n1.icdf(0), -1);
  t.equal(n1.icdf(0.2), 0);
  t.equal(n1.icdf(0.4), 1);
  t.equal(n1.icdf(0.6), 2);
  t.equal(n1.icdf(0.8), 3);
  t.equal(n1.icdf(1.0), 4);
  t.end();
});

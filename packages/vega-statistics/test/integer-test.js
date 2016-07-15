var tape = require('tape'),
    integer = require('../').randomInteger;

tape('integer generates random values', function(test) {
  var s = integer(10).sample();
  test.ok(0 <= s && s < 10);
  test.equal(s, ~~s);

  s = integer(5, 10).sample();
  test.ok(5 <= s && s < 10);
  test.equal(s, ~~s);

  test.end();
});

tape('integer evaluates the pdf', function(test) {
  var n1 = integer(0, 5);
  test.equal(n1.pdf(-1), 0.0);
  test.equal(n1.pdf(5), 0.0);
  test.equal(n1.pdf(0), 0.2);
  test.equal(n1.pdf(1), 0.2);
  test.equal(n1.pdf(2), 0.2);
  test.equal(n1.pdf(3), 0.2);
  test.equal(n1.pdf(4), 0.2);
  test.end();
});

tape('integer evaluates the cdf', function(test) {
  var n1 = integer(0, 5);
  test.equal(n1.cdf(-1), 0.0);
  test.equal(n1.cdf(0), 0.2);
  test.equal(n1.cdf(1), 0.4);
  test.equal(n1.cdf(2), 0.6);
  test.equal(n1.cdf(3), 0.8);
  test.equal(n1.cdf(4), 1.0);
  test.equal(n1.cdf(5), 1.0);
  test.end();
});

tape('integer evaluates the inverse cdf', function(test) {
  var n1 = integer(0, 5);
  // extreme values
  test.ok(isNaN(n1.icdf(-1)));
  test.ok(isNaN(n1.icdf(2)));
  // in range values
  test.equal(n1.icdf(0), -1);
  test.equal(n1.icdf(0.2), 0);
  test.equal(n1.icdf(0.4), 1);
  test.equal(n1.icdf(0.6), 2);
  test.equal(n1.icdf(0.8), 3);
  test.equal(n1.icdf(1.0), 4);
  test.end();
});

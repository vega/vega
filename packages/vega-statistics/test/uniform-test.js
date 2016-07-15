var tape = require('tape'),
    uniform = require('../').randomUniform;

tape('uniform generates random values', function(test) {
  var s = uniform().sample();
  test.ok(s >= 0 && s < 1);

  s = uniform(10).sample();
  test.ok(s >= 0 && s < 10);

  s = uniform(5, 10).sample();
  test.ok(s >= 5 && s < 10);

  test.end();
});

tape('uniform evaluates the pdf', function(test) {
  var n1 = uniform(-1, 1);
  test.equal(n1.pdf(-2), 0.0);
  test.equal(n1.pdf(2), 0.0);
  test.equal(n1.pdf(0), 0.5);
  test.equal(n1.pdf(-0.5), n1.pdf(0.5));
  test.equal(n1.pdf(-1), n1.pdf(1));
  test.end();
});

tape('uniform evaluates the cdf', function(test) {
  var n1 = uniform(-1, 1);
  // extreme values
  test.equal(n1.cdf(-2), 0);
  test.equal(n1.cdf(2), 1);
  // in range values
  test.equal(n1.cdf(0), 0.50);
  test.equal(n1.cdf(-0.5), 0.25);
  test.equal(n1.cdf(0.5), 0.75);
  test.end();
});

tape('uniform evaluates the inverse cdf', function(test) {
  var n1 = uniform(-1, 1);
  // extreme values
  test.ok(isNaN(n1.icdf(-2)));
  test.ok(isNaN(n1.icdf(2)));
  test.equal(n1.icdf(0), -1);
  test.equal(n1.icdf(1), 1);
  // in range values
  test.equal(n1.icdf(0.5), 0);
  test.equal(n1.icdf(0.25), -0.5);
  test.equal(n1.icdf(0.75), 0.5);
  test.end();
});

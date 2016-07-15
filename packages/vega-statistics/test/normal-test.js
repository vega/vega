var tape = require('tape'),
    normal = require('../').randomNormal;

function closeTo(test, a, b, delta) {
  test.equal(Math.abs(a-b) < delta, true);
}

function check(test, u, s, values) {
  var sum = values.reduce(function(a,b) { return a+b; }, 0);
  var avg = sum / values.length;
  var dev = values.reduce(function(a,b) { return a+(b-avg)*(b-avg); }, 0);
  dev = dev / (values.length-1);

  // mean within 99.9% confidence interval
  closeTo(test, u, avg, 4*dev/Math.sqrt(values.length));
}

function samples(dist, n) {
  var a = Array(n);
  while (--n >= 0) a[n] = dist.sample();
  return a;
}

tape('normal generates normal samples', function(test) {
  check(test, 0, 1, samples(normal(), 1000));
  check(test, 5, 1, samples(normal(5), 1000));
  check(test, 1, 10, samples(normal(1, 10), 1000));
  test.end();
});

tape('normal evaluates the pdf', function(test) {
  var n1 = normal();
  closeTo(test, 0.40, n1.pdf(0), 1e-2);
  closeTo(test, 0.24, n1.pdf(-1), 1e-2);
  test.equal(n1.pdf(5), n1.pdf(-5));
  test.end();
});

tape('normal approximates the cdf', function(test) {
  var n1 = normal();
  // extreme values
  test.equal(0, n1.cdf(-38));
  test.equal(1, n1.cdf(38));
  closeTo(test, 1, n1.cdf(8), 1e-5);
  // regular values
  closeTo(test, 0.680, n1.cdf(1) - n1.cdf(-1), 1e-2);
  closeTo(test, 0.950, n1.cdf(2) - n1.cdf(-2), 1e-2);
  closeTo(test, 0.997, n1.cdf(3) - n1.cdf(-3), 1e-2);
  test.end();
});

tape('normal approximates the inverse cdf', function(test) {
  var n1 = normal();
  // out of domain inputs
  test.ok(isNaN(n1.icdf(-1)));
  test.ok(isNaN(n1.icdf(2)));
  test.ok(isNaN(n1.icdf(0)));
  test.ok(isNaN(n1.icdf(1)));
  // regular values
  test.equal(0, n1.icdf(0.5));
  closeTo(test, 1, n1.icdf(n1.cdf(1)), 1e-3);
  closeTo(test, -1, n1.icdf(n1.cdf(-1)), 1e-3);
  test.end();
});

var tape = require('tape'),
    stats = require('../'),
    normal = stats.randomNormal;

// seeded RNG for deterministic tests
stats.setRandom(stats.randomLCG(123456789));

function closeTo(t, a, b, delta) {
  t.equal(Math.abs(a-b) < delta, true);
}

function check(t, u, s, values) {
  var sum = values.reduce(function(a,b) { return a+b; }, 0);
  var avg = sum / values.length;
  var dev = values.reduce(function(a,b) { return a+(b-avg)*(b-avg); }, 0);
  dev = dev / (values.length-1);

  // mean within 99.9% confidence interval
  closeTo(t, u, avg, 4*dev/Math.sqrt(values.length));
}

function samples(dist, n) {
  var a = Array(n);
  while (--n >= 0) a[n] = dist.sample();
  return a;
}

tape('normal generates normal samples', function(t) {
  check(t, 0, 1, samples(normal(), 1000));
  check(t, 5, 1, samples(normal(5), 1000));
  check(t, 1, 10, samples(normal(1, 10), 1000));
  t.end();
});

tape('normal evaluates the pdf', function(t) {
  var n1 = normal();
  closeTo(t, 0.40, n1.pdf(0), 1e-2);
  closeTo(t, 0.24, n1.pdf(-1), 1e-2);
  t.equal(n1.pdf(5), n1.pdf(-5));
  t.end();
});

tape('normal approximates the cdf', function(t) {
  var n1 = normal();
  // extreme values
  t.equal(0, n1.cdf(-38));
  t.equal(1, n1.cdf(38));
  closeTo(t, 1, n1.cdf(8), 1e-5);
  // regular values
  closeTo(t, 0.680, n1.cdf(1) - n1.cdf(-1), 1e-2);
  closeTo(t, 0.950, n1.cdf(2) - n1.cdf(-2), 1e-2);
  closeTo(t, 0.997, n1.cdf(3) - n1.cdf(-3), 1e-2);
  t.end();
});

tape('normal approximates the inverse cdf', function(t) {
  var n1 = normal();
  // out of domain inputs
  t.ok(isNaN(n1.icdf(-1)));
  t.ok(isNaN(n1.icdf(2)));
  t.ok(isNaN(n1.icdf(0)));
  t.ok(isNaN(n1.icdf(1)));
  // regular values
  t.equal(0, n1.icdf(0.5));
  closeTo(t, 1, n1.icdf(n1.cdf(1)), 1e-3);
  closeTo(t, -1, n1.icdf(n1.cdf(-1)), 1e-3);
  t.end();
});

var stats = require('../'), normal = stats.randomNormal;

// seeded RNG for deterministic tests
stats.setRandom(stats.randomLCG(123456789));

function closeTo(a, b, delta) {
  expect(Math.abs(a-b) < delta).toBe(true);
}

function check(u, s, values) {
  var sum = values.reduce(function(a,b) { return a+b; }, 0);
  var avg = sum / values.length;
  var dev = values.reduce(function(a,b) { return a+(b-avg)*(b-avg); }, 0);
  dev = dev / (values.length-1);

  // mean within 99.9% confidence interval
  closeTo(u, avg, 4*dev/Math.sqrt(values.length));
}

function samples(dist, n) {
  var a = Array(n);
  while (--n >= 0) a[n] = dist.sample();
  return a;
}

test('normal generates normal samples', function() {
  check(0, 1, samples(normal(), 1000));
  check(5, 1, samples(normal(5), 1000));
  check(1, 10, samples(normal(1, 10), 1000));
});

test('normal evaluates the pdf', function() {
  var n1 = normal();
  closeTo(0.40, n1.pdf(0), 1e-2);
  closeTo(0.24, n1.pdf(-1), 1e-2);
  expect(n1.pdf(5)).toBe(n1.pdf(-5));
});

test('normal approximates the cdf', function() {
  var n1 = normal();
  // extreme values
  expect(0).toBe(n1.cdf(-38));
  expect(1).toBe(n1.cdf(38));
  closeTo(1, n1.cdf(8), 1e-5);
  // regular values
  closeTo(0.680, n1.cdf(1) - n1.cdf(-1), 1e-2);
  closeTo(0.950, n1.cdf(2) - n1.cdf(-2), 1e-2);
  closeTo(0.997, n1.cdf(3) - n1.cdf(-3), 1e-2);
});

test('normal approximates the inverse cdf', function() {
  var n1 = normal();
  // out of domain inputs
  expect(isNaN(n1.icdf(-1))).toBeTruthy();
  expect(isNaN(n1.icdf(2))).toBeTruthy();
  expect(isNaN(n1.icdf(0))).toBeTruthy();
  expect(isNaN(n1.icdf(1))).toBeTruthy();
  // regular values
  expect(0).toBe(n1.icdf(0.5));
  closeTo(1, n1.icdf(n1.cdf(1)), 1e-3);
  closeTo(-1, n1.icdf(n1.cdf(-1)), 1e-3);
});

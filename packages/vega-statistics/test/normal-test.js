var tape = require('tape'),
    stats = require('../'),
    normal = stats.randomNormal;

// seeded RNG for deterministic tests
stats.setRandom(stats.randomLCG(123456789));

function closeTo(t, a, b, delta) {
  t.equal(Math.abs(a-b) < delta, true);
}

function check(t, u, s, values) {
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  let dev = values.reduce((a, b) => a + (b-avg)*(b-avg), 0);
  dev = dev / (values.length-1);

  // mean within 99.9% confidence interval
  closeTo(t, u, avg, 4*dev/Math.sqrt(values.length));
}

function samples(dist, n) {
  const a = Array(n);
  while (--n >= 0) a[n] = dist.sample();
  return a;
}

tape('normal generates normal samples', t => {
  check(t, 0, 1, samples(normal(), 1000));
  check(t, 5, 1, samples(normal(5), 1000));
  check(t, 1, 10, samples(normal(1, 10), 1000));
  t.end();
});

tape('normal evaluates the pdf', t => {
  const n1 = normal();
  closeTo(t, 0.40, n1.pdf(0), 1e-2);
  closeTo(t, 0.24, n1.pdf(-1), 1e-2);
  t.equal(n1.pdf(5), n1.pdf(-5));
  t.end();
});

tape('normal approximates the cdf', t => {
  const n1 = normal();
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

tape('normal approximates the inverse cdf', t => {
  const n1 = normal();
  // out of domain inputs
  t.ok(Number.isNaN(n1.icdf(-1)));
  t.ok(Number.isNaN(n1.icdf(2)));
  t.equal(n1.icdf(0), -Infinity);
  t.equal(n1.icdf(1), Infinity);
  // regular values
  t.equal(0, n1.icdf(0.5));
  closeTo(t, 1, n1.icdf(n1.cdf(1)), 1e-3);
  closeTo(t, -1, n1.icdf(n1.cdf(-1)), 1e-3);
  t.end();
});

tape('cumulativeNormal matches R output', t => {
  var v = [-3, -2, -1, 0, 1, 2, 3],
      R = [0.001349898, 0.022750132, 0.158655254, 0.500000000, 0.841344746, 0.977249868, 0.998650102];

  v.map(x => stats.cumulativeNormal(x))
   .forEach((x, i) => closeTo(t, x, R[i], 1e-3));

  t.end();
});

tape('densityNormal matches R output', t => {
  var v = [-3, -2, -1, 0, 1, 2, 3],
      R = [0.004431848, 0.053990967, 0.241970725, 0.398942280, 0.241970725, 0.053990967, 0.004431848];

  v.map(x => stats.densityNormal(x))
   .forEach((x, i) => closeTo(t, x, R[i], 1e-3));

  t.end();
});

tape('quantileNormal matches R output', t => {
  var p = [0.95, 0.9, 0.75, 0.5, 0.25, 0.1, 0.05],
      R = [1.6448536, 1.2815516, 0.6744898, 0.0000000, -0.6744898, -1.2815516, -1.6448536];

  p.map(x => stats.quantileNormal(x))
   .forEach((x, i) => closeTo(t, x, R[i], 1e-3));

  t.end();
});

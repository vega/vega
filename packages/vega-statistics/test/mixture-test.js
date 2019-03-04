var d3 = require('d3-array'), stats = require('../'), gaussian = stats.randomNormal();

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

test('mixture generates samples', function() {
  var dists = [
    stats.randomNormal(),
    stats.randomNormal()
  ];
  var mix = stats.randomMixture(dists);
  check(0, 1, samples(mix, 1000));

  mix = stats.randomMixture(dists, [2, 1]);
  check(0, 1, samples(mix, 1000));

  mix = stats.randomMixture([
    stats.randomNormal(),
    stats.randomUniform()
  ], [1, 0]);
  check(0, 1, samples(mix, 1000));
});

test('mixture evaluates the pdf', function() {
  var mix = stats.randomMixture([stats.randomNormal(), stats.randomNormal()]),
      domain = d3.range(-5, 5.1, 0.5),
      error = domain.reduce(function(sum, x) {
        return sum + Math.abs(mix.pdf(x) - gaussian.pdf(x));
      }, 0);

  expect((error / domain.length) < 0.01).toBeTruthy();
});

test('mixture approximates the cdf', function() {
  var mix = stats.randomMixture([stats.randomNormal(), stats.randomNormal()]),
      domain = d3.range(-5, 5.1, 0.5),
      error = domain.reduce(function(sum, x) {
        return sum + Math.abs(mix.cdf(x) - gaussian.cdf(x));
      }, 0);

  expect((error / domain.length) < 0.01).toBeTruthy();
});

test('mixture does not support the inverse cdf', function() {
  var mix = stats.randomMixture([
    stats.randomNormal(),
    stats.randomUniform(-1, 1)
  ]);
  expect(function() { mix.icdf(0.5); }).toThrow();
});

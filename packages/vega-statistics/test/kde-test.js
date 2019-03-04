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

test('kde generates samples', function() {
  var kde = stats.randomKDE(d3.range(0, 1000)
    .map(gaussian.sample));
  check(0, 1, samples(kde, 1000));

  kde = stats.randomKDE(d3.range(0, 1000)
    .map(function() { return 5 * gaussian.sample(); }));
  check(0, 5, samples(kde, 1000));
});

test('kde approximates the pdf', function() {
  var data = d3.range(0, 1000).map(gaussian.sample),
      kde = stats.randomKDE(data),
      domain = d3.range(-5, 5.1, 0.5),
      error = domain.map(function(x) {
        return Math.abs(kde.pdf(x) - gaussian.pdf(x));
      });

  expect((d3.sum(error) / domain.length) < 0.01).toBeTruthy();
});

test('kde approximates the cdf', function() {
  var data = d3.range(0, 1000).map(gaussian.sample),
      kde = stats.randomKDE(data),
      domain = d3.range(-5, 5.1, 0.5),
      error = domain.map(function(x) {
        return Math.abs(kde.cdf(x) - gaussian.cdf(x));
      });

  expect((d3.sum(error) / domain.length) < 0.01).toBeTruthy();
});

test('kde does not support the inverse cdf', function() {
  expect(function() { stats.randomKDE([1,1,1]).icdf(0.5); }).toThrow();
});

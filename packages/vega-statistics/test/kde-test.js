var tape = require('tape'),
    d3 = require('d3-array'),
    stats = require('../'),
    gaussian = stats.randomNormal();

function lcg(seed) {
  // Random numbers using a Linear Congruential Generator with seed value
  // Uses glibc values from https://en.wikipedia.org/wiki/Linear_congruential_generator
  return function() {
    seed = (1103515245 * seed + 12345) % 2147483647;
    return seed / 2147483647;
  };
}

// seeded RNG for deterministic tests
stats.setRandom(lcg(123456789));

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

tape('kde generates samples', function(t) {
  var kde = stats.randomKDE(d3.range(0, 1000)
    .map(gaussian.sample));
  check(t, 0, 1, samples(kde, 1000));

  kde = stats.randomKDE(d3.range(0, 1000)
    .map(function() { return 5 * gaussian.sample(); }));
  check(t, 0, 5, samples(kde, 1000));

  t.end();
});

tape('kde approximates the pdf', function(t) {
  var data = d3.range(0, 1000).map(gaussian.sample),
      kde = stats.randomKDE(data),
      domain = d3.range(-5, 5.1, 0.5),
      error = domain.map(function(x) {
        return Math.abs(kde.pdf(x) - gaussian.pdf(x));
      });

  t.ok((d3.sum(error) / domain.length) < 0.01);
  t.end();
});

tape('kde approximates the cdf', function(t) {
  var data = d3.range(0, 1000).map(gaussian.sample),
      kde = stats.randomKDE(data),
      domain = d3.range(-5, 5.1, 0.5),
      error = domain.map(function(x) {
        return Math.abs(kde.cdf(x) - gaussian.cdf(x));
      });

  t.ok((d3.sum(error) / domain.length) < 0.01);
  t.end();
});

tape('kde does not support the inverse cdf', function(t) {
  t.throws(function() { stats.randomKDE([1,1,1]).icdf(0.5); });
  t.end();
});

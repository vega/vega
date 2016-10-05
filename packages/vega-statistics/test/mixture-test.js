var tape = require('tape'),
    d3 = require('d3-array'),
    stats = require('../'),
    gaussian = stats.randomNormal();

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

tape('mixture generates samples', function(test) {
  var dists = [
    stats.randomNormal(),
    stats.randomNormal()
  ];
  var mix = stats.randomMixture(dists);
  check(test, 0, 1, samples(mix, 1000));

  mix = stats.randomMixture(dists, [2, 1]);
  check(test, 0, 1, samples(mix, 1000));

  mix = stats.randomMixture([
    stats.randomNormal(),
    stats.randomUniform()
  ], [1, 0]);
  check(test, 0, 1, samples(mix, 1000));

  test.end();
});

tape('mixture evaluates the pdf', function(test) {
  var mix = stats.randomMixture([stats.randomNormal(), stats.randomNormal()]),
      domain = d3.range(-5, 5.1, 0.5),
      error = domain.reduce(function(sum, x) {
        return sum + Math.abs(mix.pdf(x) - gaussian.pdf(x));
      }, 0);

  test.ok((error / domain.length) < 0.01);
  test.end();
});

tape('mixture approximates the cdf', function(test) {
  var mix = stats.randomMixture([stats.randomNormal(), stats.randomNormal()]),
      domain = d3.range(-5, 5.1, 0.5),
      error = domain.reduce(function(sum, x) {
        return sum + Math.abs(mix.cdf(x) - gaussian.cdf(x));
      }, 0);

  test.ok((error / domain.length) < 0.01);
  test.end();
});

tape('mixture does not support the inverse cdf', function(test) {
  var mix = stats.randomMixture([
    stats.randomNormal(),
    stats.randomUniform(-1, 1)
  ]);
  test.throws(function() { mix.icdf(0.5); });
  test.end();
});

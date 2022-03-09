var tape = require('tape'),
    stats = require('../'),
    gaussian = stats.randomNormal();

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

tape('kde generates samples', t => {
  let kde = stats.randomKDE(samples(gaussian, 1000));
  check(t, 0, 1, samples(kde, 1000));

  kde = stats.randomKDE(samples(stats.randomNormal(0, 5), 1000));
  check(t, 0, 5, samples(kde, 1000));

  t.end();
});

tape('kde approximates the pdf', t => {
  var data = samples(gaussian, 1000),
      kde = stats.randomKDE(data),
      domain = Array.from({ length: 20 }, (_, i) => -5 + 0.5 * i),
      error = domain.map(x => Math.abs(kde.pdf(x) - gaussian.pdf(x))),
      sum_err = error.reduce((a, b) => a + b, 0);

  t.ok((sum_err / domain.length) < 0.01);
  t.end();
});

tape('kde approximates the cdf', t => {
  var data = samples(gaussian, 1000),
      kde = stats.randomKDE(data),
      domain = Array.from({ length: 20 }, (_, i) => -5 + 0.5 * i),
      error = domain.map(x => Math.abs(kde.cdf(x) - gaussian.cdf(x))),
      sum_err = error.reduce((a, b) => a + b, 0);

  t.ok((sum_err / domain.length) < 0.01);
  t.end();
});

tape('kde does not support the inverse cdf', t => {
  t.throws(() => { stats.randomKDE([1,1,1]).icdf(0.5); });
  t.end();
});

tape('kde auto-selects positive bandwidth values', t => {
  const a = [377, 347, 347, 347, 347, 347];
  t.ok(stats.randomKDE(a).bandwidth() > 0);
  t.ok(stats.randomKDE(a.slice(1)).bandwidth() > 0);
  t.ok(stats.randomKDE([-1, -1, -1]).bandwidth() > 0);
  t.ok(stats.randomKDE([0, 0, 0]).bandwidth() > 0);
  t.ok(stats.randomKDE([]).bandwidth() > 0);
  t.end();
});

var tape = require('tape'),
    stats = require('../');

function closeTo(t, a, b, delta) {
  t.equal(Math.abs(a-b) < delta, true);
}

tape('cumulativeLogNormal matches R output', t => {
  var v = [0.125, 0.25, 0.5, 1, 2, 4, 16],
      R = [0.01878839, 0.08282852, 0.24410860, 0.50000000, 0.75589140, 0.91717148, 0.99721938];

  v.map(x => stats.cumulativeLogNormal(x))
   .forEach((x, i) => closeTo(t, x, R[i], 1e-3));

  t.end();
});

tape('densityLogNormal matches R output', t => {
  var v = [0.125, 0.25, 0.5, 1, 2, 4, 16],
      R = [0.3673149759, 0.6104553042, 0.6274960771, 0.3989422804, 0.1568740193, 0.0381534565, 0.0005339804];

  v.map(x => stats.densityLogNormal(x))
   .forEach((x, i) => closeTo(t, x, R[i], 1e-3));

  t.end();
});

tape('quantileLogNormal matches R output', t => {
  var p = [0.95, 0.9, 0.75, 0.5, 0.25, 0.1, 0.05],
      R = [5.1802516, 3.6022245, 1.9630311, 1.0000000, 0.5094163, 0.2776062, 0.1930408];

  p.map(x => stats.quantileLogNormal(x))
   .forEach((x, i) => closeTo(t, x, R[i], 1e-3));

  t.end();
});

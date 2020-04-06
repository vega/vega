const tape = require('tape');
const vega = require('../');

tape('scheme registers a single color scheme', function (t) {
  const name = 'rgb';
  const colors = ['#f00', '#0f0', '#00f'];

  t.equal(vega.scheme(name), undefined);
  vega.scheme(name, colors);
  t.deepEqual(vega.scheme(name), colors);
  t.end();
});

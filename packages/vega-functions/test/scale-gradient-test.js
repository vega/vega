var tape = require('tape'),
    {scale} = require('vega-scale'),
    {scaleGradient} = require('../');

tape('scaleGradient handles zero-span domain', t => {
  const s = scale('linear')().range(['#f00', '#00f']);

  function testGradient(domain) {
    const g = scaleGradient.call({}, s.domain(domain), [0, 0], [1, 0], 3),
          n = g.stops.length - 1;

    t.equal(g.stops[0].offset, 0);
    t.equal(g.stops[n>>1].offset, 0.5);
    t.equal(g.stops[n].offset, 1.0);
    t.equal(g.stops[0].color, 'rgb(255, 0, 0)');
    t.equal(g.stops[n>>1].color, 'rgb(128, 0, 128)');
    t.equal(g.stops[n].color, 'rgb(0, 0, 255)');
  }

  testGradient([1, 1]);
  testGradient([-1, -1]);
  testGradient([0, 0]);
  testGradient([null, null]);
  testGradient([undefined, undefined]);
  testGradient([NaN, NaN]);

  t.end();
});

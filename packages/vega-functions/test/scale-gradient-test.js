var {scale} = require('vega-scale'), {scaleGradient} = require('../');

test('scaleGradient handles zero-span domain', function() {
  let s = scale('linear')().range(['#f00', '#00f']);

  function testGradient(domain) {
    const g = scaleGradient.call({}, s.domain(domain), [0, 0], [1, 0], 3),
          n = g.stops.length - 1;

    expect(g.stops[0].offset).toBe(0);
    expect(g.stops[n>>1].offset).toBe(0.5);
    expect(g.stops[n].offset).toBe(1.0);
    expect(g.stops[0].color).toBe('rgb(255, 0, 0)');
    expect(g.stops[n>>1].color).toBe('rgb(128, 0, 128)');
    expect(g.stops[n].color).toBe('rgb(0, 0, 255)');
  }

  testGradient([1, 1]);
  testGradient([-1, -1]);
  testGradient([0, 0]);
  testGradient([null, null]);
  testGradient([undefined, undefined]);
  testGradient([NaN, NaN]);
});

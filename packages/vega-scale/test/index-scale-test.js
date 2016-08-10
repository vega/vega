var tape = require('tape'),
    vega = require('../'),
    indexScale = vega.scale('index');

tape('Index scale maps ordinal domain to linear range', function(test) {
  var domain = ['a', 'b', 'c', 'd', 'e'],
      output = [0, 25, 50, 75, 100],
      range = [0, 100],
      scale = indexScale().domain(domain).range(range);

  test.deepEqual(scale.domain(), domain);
  test.deepEqual(scale.range(), range);
  test.equal(scale.interpolator, undefined);

  test.deepEqual(domain.map(scale), output);
  test.equal(scale('f'), undefined);
  test.equal(scale(null), undefined);
  test.equal(scale(undefined), undefined);

  test.deepEqual(output.map(scale.invert), domain);
  test.equal(scale.invert(-1), undefined);
  test.equal(scale.invert(24.5), undefined);
  test.equal(scale.invert(100.1), undefined);

  test.deepEqual(scale.invertExtent(0, 100), domain);
  test.deepEqual(scale.invertExtent(100, 0), domain);
  test.deepEqual(scale.invertExtent(50, 120), domain.slice(2));
  test.deepEqual(scale.invertExtent(-50, 49), domain.slice(0, 2));
  test.deepEqual(scale.invertExtent(30, 50), domain.slice(2, 3));
  test.deepEqual(scale.invertExtent(30, 40), []);
  test.deepEqual(scale.invertExtent(-2, -1), []);
  test.deepEqual(scale.invertExtent(101, 102), []);
  test.deepEqual(scale.invertExtent(0), domain.slice(0, 1));
  test.deepEqual(scale.invertExtent(1), []);

  var copy = scale.copy();
  test.deepEqual(scale.domain(), copy.domain());
  test.deepEqual(scale.range(), copy.range());
  test.equal(scale.interpolate(), copy.interpolate());

  test.end();
});


tape('Index scale maps ordinal domain to sequential range', function(test) {
  var domain = ['a', 'b', 'c', 'd', 'e'],
      output = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
      scheme = vega.scheme('viridis'),
      scale = indexScale(scheme).domain(domain);

  test.deepEqual(scale.domain(), domain);
  test.equal(scale.interpolator(), scheme);
  test.equal(scale.interpolate, undefined);
  test.equal(scale.range, undefined);
  test.equal(scale.rangeRound, undefined);
  test.equal(scale.invert, undefined);
  test.equal(scale.invertExtent, undefined);

  test.deepEqual(domain.map(scale), output);
  test.equal(scale('f'), undefined);
  test.equal(scale(null), undefined);
  test.equal(scale(undefined), undefined);

  var copy = scale.copy();
  test.deepEqual(scale.domain(), copy.domain());
  test.equal(scale.interpolator(), copy.interpolator());

  test.end();
});

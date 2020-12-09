var tape = require('tape'),
    vega = require('../'),
    bandScale = vega.scale('band');

tape('band.invert inverts single value', t => {
  const s = bandScale().domain(['foo', 'bar']);

  // ascending range
  s.range([0,2]);
  t.deepEqual(s.invert(-1),  undefined);
  t.deepEqual(s.invert(0.0), 'foo');
  t.deepEqual(s.invert(0.5), 'foo');
  t.deepEqual(s.invert(1.0), 'bar');
  t.deepEqual(s.invert(1.5), 'bar');
  t.deepEqual(s.invert(2.0), 'bar');
  t.deepEqual(s.invert(2.1), undefined);

  // ascending range with padding
  s.padding(0.3);
  t.deepEqual(s.invert(-1),  undefined);
  t.deepEqual(s.invert(0.0), undefined);
  t.deepEqual(s.invert(0.5), 'foo');
  t.deepEqual(s.invert(1.0), undefined);
  t.deepEqual(s.invert(1.5), 'bar');
  t.deepEqual(s.invert(2.0), undefined);
  t.deepEqual(s.invert(2.1), undefined);

  // descending range
  s.padding(0).range([2, 0]);
  t.deepEqual(s.invert(-1),  undefined);
  t.deepEqual(s.invert(0.0), 'bar');
  t.deepEqual(s.invert(0.5), 'bar');
  t.deepEqual(s.invert(1.0), 'foo');
  t.deepEqual(s.invert(1.5), 'foo');
  t.deepEqual(s.invert(2.0), 'foo');
  t.deepEqual(s.invert(2.1), undefined);

  // descending range with padding
  s.padding(0.3);
  t.deepEqual(s.invert(-1),  undefined);
  t.deepEqual(s.invert(0.0), undefined);
  t.deepEqual(s.invert(0.5), 'bar');
  t.deepEqual(s.invert(1.0), undefined);
  t.deepEqual(s.invert(1.5), 'foo');
  t.deepEqual(s.invert(2.0), undefined);
  t.deepEqual(s.invert(2.1), undefined);

  t.end();
});

tape('band.invertRange inverts value range', t => {
  const s = bandScale().domain(['foo', 'bar']);

  // empty and invalid ranges should fail
  t.deepEqual(s.invertRange([]), undefined);
  t.deepEqual(s.invertRange([0, NaN]), undefined);
  t.deepEqual(s.invertRange([0, undefined]), undefined);
  t.deepEqual(s.invertRange([0, null]), undefined);
  t.deepEqual(s.invertRange([NaN, 1]), undefined);
  t.deepEqual(s.invertRange([undefined, 1]), undefined);
  t.deepEqual(s.invertRange([null, 1]), undefined);

  // ascending range
  s.range([0, 2]);
  t.deepEqual(s.invertRange([-2, -1]), undefined);
  t.deepEqual(s.invertRange([-1, 0]),  ['foo']);
  t.deepEqual(s.invertRange([0, 0.5]), ['foo']);
  t.deepEqual(s.invertRange([0, 1]),   ['foo', 'bar']);
  t.deepEqual(s.invertRange([0, 2]),   ['foo', 'bar']);
  t.deepEqual(s.invertRange([2, 3]),   ['bar']);
  t.deepEqual(s.invertRange([3, 4]),   undefined);

  // ascending range with padding
  s.padding(0.3);
  t.deepEqual(s.invertRange([ -1,   0]),  undefined);
  t.deepEqual(s.invertRange([0.0, 0.1]),  undefined);
  t.deepEqual(s.invertRange([0.0, 0.5]), ['foo']);
  t.deepEqual(s.invertRange([0.5, 1.5]), ['foo', 'bar']);
  t.deepEqual(s.invertRange([0.9, 1.1]), undefined);
  t.deepEqual(s.invertRange([1.0, 1.5]), ['bar']);
  t.deepEqual(s.invertRange([1.9, 2.0]), undefined);

  // descending range
  s.padding(0).range([2, 0]);
  t.deepEqual(s.invertRange([-2, -1]), undefined);
  t.deepEqual(s.invertRange([-1, 0]),  ['bar']);
  t.deepEqual(s.invertRange([0, 0.5]), ['bar']);
  t.deepEqual(s.invertRange([0, 1]),   ['foo', 'bar']);
  t.deepEqual(s.invertRange([0, 2]),   ['foo', 'bar']);
  t.deepEqual(s.invertRange([2, 3]),   ['foo']);
  t.deepEqual(s.invertRange([3, 4]),   undefined);

  // descending range with padding
  s.padding(0.3);
  t.deepEqual(s.invertRange([ -1, 0.0]),  undefined);
  t.deepEqual(s.invertRange([0.0, 0.1]),  undefined);
  t.deepEqual(s.invertRange([0.0, 0.5]), ['bar']);
  t.deepEqual(s.invertRange([0.5, 1.5]), ['foo', 'bar']);
  t.deepEqual(s.invertRange([0.9, 1.1]), undefined);
  t.deepEqual(s.invertRange([1.0, 1.5]), ['foo']);
  t.deepEqual(s.invertRange([1.9, 2.0]), undefined);

  t.end();
});

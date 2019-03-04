var vega = require('../'), bandScale = vega.scale('band');

test('band.invert inverts single value', function() {
  var s = bandScale().domain(['foo', 'bar']);

  // ascending range
  s.range([0,2]);
  expect(s.invert(-1)).toEqual(undefined);
  expect(s.invert(0.0)).toEqual('foo');
  expect(s.invert(0.5)).toEqual('foo');
  expect(s.invert(1.0)).toEqual('bar');
  expect(s.invert(1.5)).toEqual('bar');
  expect(s.invert(2.0)).toEqual('bar');
  expect(s.invert(2.1)).toEqual(undefined);

  // ascending range with padding
  s.padding(0.3);
  expect(s.invert(-1)).toEqual(undefined);
  expect(s.invert(0.0)).toEqual(undefined);
  expect(s.invert(0.5)).toEqual('foo');
  expect(s.invert(1.0)).toEqual(undefined);
  expect(s.invert(1.5)).toEqual('bar');
  expect(s.invert(2.0)).toEqual(undefined);
  expect(s.invert(2.1)).toEqual(undefined);

  // descending range
  s.padding(0).range([2, 0]);
  expect(s.invert(-1)).toEqual(undefined);
  expect(s.invert(0.0)).toEqual('bar');
  expect(s.invert(0.5)).toEqual('bar');
  expect(s.invert(1.0)).toEqual('foo');
  expect(s.invert(1.5)).toEqual('foo');
  expect(s.invert(2.0)).toEqual('foo');
  expect(s.invert(2.1)).toEqual(undefined);

  // descending range with padding
  s.padding(0.3);
  expect(s.invert(-1)).toEqual(undefined);
  expect(s.invert(0.0)).toEqual(undefined);
  expect(s.invert(0.5)).toEqual('bar');
  expect(s.invert(1.0)).toEqual(undefined);
  expect(s.invert(1.5)).toEqual('foo');
  expect(s.invert(2.0)).toEqual(undefined);
  expect(s.invert(2.1)).toEqual(undefined);
});

test('band.invertRange inverts value range', function() {
  var s = bandScale().domain(['foo', 'bar']);

  // empty and invalid ranges should fail
  expect(s.invertRange([])).toEqual(undefined);
  expect(s.invertRange([0, NaN])).toEqual(undefined);
  expect(s.invertRange([0, undefined])).toEqual(undefined);
  expect(s.invertRange([0, null])).toEqual(undefined);
  expect(s.invertRange([NaN, 1])).toEqual(undefined);
  expect(s.invertRange([undefined, 1])).toEqual(undefined);
  expect(s.invertRange([null, 1])).toEqual(undefined);

  // ascending range
  s.range([0, 2]);
  expect(s.invertRange([-2, -1])).toEqual(undefined);
  expect(s.invertRange([-1, 0])).toEqual(['foo']);
  expect(s.invertRange([0, 0.5])).toEqual(['foo']);
  expect(s.invertRange([0, 1])).toEqual(['foo', 'bar']);
  expect(s.invertRange([0, 2])).toEqual(['foo', 'bar']);
  expect(s.invertRange([2, 3])).toEqual(['bar']);
  expect(s.invertRange([3, 4])).toEqual(undefined);

  // ascending range with padding
  s.padding(0.3);
  expect(s.invertRange([ -1,   0])).toEqual(undefined);
  expect(s.invertRange([0.0, 0.1])).toEqual(undefined);
  expect(s.invertRange([0.0, 0.5])).toEqual(['foo']);
  expect(s.invertRange([0.5, 1.5])).toEqual(['foo', 'bar']);
  expect(s.invertRange([0.9, 1.1])).toEqual(undefined);
  expect(s.invertRange([1.0, 1.5])).toEqual(['bar']);
  expect(s.invertRange([1.9, 2.0])).toEqual(undefined);

  // descending range
  s.padding(0).range([2, 0]);
  expect(s.invertRange([-2, -1])).toEqual(undefined);
  expect(s.invertRange([-1, 0])).toEqual(['bar']);
  expect(s.invertRange([0, 0.5])).toEqual(['bar']);
  expect(s.invertRange([0, 1])).toEqual(['foo', 'bar']);
  expect(s.invertRange([0, 2])).toEqual(['foo', 'bar']);
  expect(s.invertRange([2, 3])).toEqual(['foo']);
  expect(s.invertRange([3, 4])).toEqual(undefined);

  // descending range with padding
  s.padding(0.3);
  expect(s.invertRange([ -1, 0.0])).toEqual(undefined);
  expect(s.invertRange([0.0, 0.1])).toEqual(undefined);
  expect(s.invertRange([0.0, 0.5])).toEqual(['bar']);
  expect(s.invertRange([0.5, 1.5])).toEqual(['foo', 'bar']);
  expect(s.invertRange([0.9, 1.1])).toEqual(undefined);
  expect(s.invertRange([1.0, 1.5])).toEqual(['foo']);
  expect(s.invertRange([1.9, 2.0])).toEqual(undefined);
});

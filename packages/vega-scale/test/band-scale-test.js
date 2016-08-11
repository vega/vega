var tape = require('tape'),
    vega = require('../'),
    bandScale = vega.scale('band');

tape('band.invertRange(x) inverts single value', function(test) {
  var s = bandScale().domain(['foo', 'bar']);

  // ascending range
  s.range([0,2]);
  test.deepEqual(s.invertRange(-1),  undefined);
  test.deepEqual(s.invertRange(0.0), ['foo']);
  test.deepEqual(s.invertRange(0.5), ['foo']);
  test.deepEqual(s.invertRange(1.0), ['bar']);
  test.deepEqual(s.invertRange(1.5), ['bar']);
  test.deepEqual(s.invertRange(2.0), ['bar']);
  test.deepEqual(s.invertRange(2.1), undefined);

  // ascending range with padding
  s.padding(0.3);
  test.deepEqual(s.invertRange(-1),  undefined);
  test.deepEqual(s.invertRange(0.0), undefined);
  test.deepEqual(s.invertRange(0.5), ['foo']);
  test.deepEqual(s.invertRange(1.0), undefined);
  test.deepEqual(s.invertRange(1.5), ['bar']);
  test.deepEqual(s.invertRange(2.0), undefined);
  test.deepEqual(s.invertRange(2.1), undefined);

  // descending range
  s.padding(0).range([2, 0]);
  test.deepEqual(s.invertRange(-1),  undefined);
  test.deepEqual(s.invertRange(0.0), ['bar']);
  test.deepEqual(s.invertRange(0.5), ['bar']);
  test.deepEqual(s.invertRange(1.0), ['foo']);
  test.deepEqual(s.invertRange(1.5), ['foo']);
  test.deepEqual(s.invertRange(2.0), ['foo']);
  test.deepEqual(s.invertRange(2.1), undefined);

  // descending range with padding
  s.padding(0.3);
  test.deepEqual(s.invertRange(-1),  undefined);
  test.deepEqual(s.invertRange(0.0), undefined);
  test.deepEqual(s.invertRange(0.5), ['bar']);
  test.deepEqual(s.invertRange(1.0), undefined);
  test.deepEqual(s.invertRange(1.5), ['foo']);
  test.deepEqual(s.invertRange(2.0), undefined);
  test.deepEqual(s.invertRange(2.1), undefined);

  test.end();
});

tape('band.invertRange(x, y) inverts value range', function(test) {
  var s = bandScale().domain(['foo', 'bar']);

  // ascending range
  s.range([0, 2]);
  test.deepEqual(s.invertRange(-2, -1), undefined);
  test.deepEqual(s.invertRange(-1, 0),  ['foo']);
  test.deepEqual(s.invertRange(0, 0.5), ['foo']);
  test.deepEqual(s.invertRange(0, 1),   ['foo', 'bar']);
  test.deepEqual(s.invertRange(0, 2),   ['foo', 'bar']);
  test.deepEqual(s.invertRange(2, 3),   ['bar']);
  test.deepEqual(s.invertRange(3, 4),   undefined);

  // ascending range with padding
  s.padding(0.3);
  test.deepEqual(s.invertRange( -1,   0),  undefined);
  test.deepEqual(s.invertRange(0.0, 0.1),  undefined);
  test.deepEqual(s.invertRange(0.0, 0.5), ['foo']);
  test.deepEqual(s.invertRange(0.5, 1.5), ['foo', 'bar']);
  test.deepEqual(s.invertRange(0.9, 1.1), undefined);
  test.deepEqual(s.invertRange(1.0, 1.5), ['bar']);
  test.deepEqual(s.invertRange(1.9, 2.0), undefined);

  // descending range
  s.padding(0).range([2, 0]);
  test.deepEqual(s.invertRange(-2, -1), undefined);
  test.deepEqual(s.invertRange(-1, 0),  ['bar']);
  test.deepEqual(s.invertRange(0, 0.5), ['bar']);
  test.deepEqual(s.invertRange(0, 1),   ['foo', 'bar']);
  test.deepEqual(s.invertRange(0, 2),   ['foo', 'bar']);
  test.deepEqual(s.invertRange(2, 3),   ['foo']);
  test.deepEqual(s.invertRange(3, 4),   undefined);

  // descending range with padding
  s.padding(0.3);
  test.deepEqual(s.invertRange( -1, 0.0),  undefined);
  test.deepEqual(s.invertRange(0.0, 0.1),  undefined);
  test.deepEqual(s.invertRange(0.0, 0.5), ['bar']);
  test.deepEqual(s.invertRange(0.5, 1.5), ['foo', 'bar']);
  test.deepEqual(s.invertRange(0.9, 1.1), undefined);
  test.deepEqual(s.invertRange(1.0, 1.5), ['foo']);
  test.deepEqual(s.invertRange(1.9, 2.0), undefined);

  test.end();
});

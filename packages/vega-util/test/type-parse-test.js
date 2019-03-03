var vega = require('../');

test('toBoolean parses booleans', function() {
  expect(vega.toBoolean(null)).toBe(null);
  expect(vega.toBoolean(undefined)).toBe(null);
  expect(vega.toBoolean('')).toBe(null);
  expect(vega.toBoolean('false')).toBe(false);
  expect(vega.toBoolean('true')).toBe(true);
  expect(vega.toBoolean('foo')).toBe(true);
  expect(vega.toBoolean('1')).toBe(true);
  expect(vega.toBoolean('0')).toBe(false);
  expect(vega.toBoolean(0)).toBe(false);
  expect(vega.toBoolean(1)).toBe(true);
  expect(vega.toBoolean(false)).toBe(false);
  expect(vega.toBoolean(true)).toBe(true);
});

test('toDate parses dates', function() {
  var now = Date.now(),
      d = new Date(now);

  expect(vega.toDate(null)).toBe(null);
  expect(vega.toDate(undefined)).toBe(null);
  expect(vega.toDate('')).toBe(null);
  expect(vega.toDate('1/1/2000')).toBe(Date.parse('1/1/2000'));
  expect(isNaN(vega.toDate('foo'))).toBeTruthy();
  expect(vega.toDate(0)).toBe(0);
  expect(vega.toDate(1)).toBe(1);
  expect(vega.toDate(now)).toBe(now);
  expect(vega.toDate(d)).toBe(d);
  expect(isNaN(vega.toDate(true))).toBeTruthy();
  expect(isNaN(vega.toDate(false))).toBeTruthy();
});

test('toDate parses dates with custom parser', function() {
  function parser(_) {
    return _ === 'epoch' ? 0 : NaN;
  }

  expect(vega.toDate(null, parser)).toBe(null);
  expect(vega.toDate(undefined, parser)).toBe(null);
  expect(vega.toDate('', parser)).toBe(null);
  expect(isNaN(vega.toDate('1/1/2000', parser))).toBeTruthy();
  expect(isNaN(vega.toDate('foo', parser))).toBeTruthy();
  expect(isNaN(vega.toDate(Date.now(), parser))).toBeTruthy();
  expect(isNaN(vega.toDate(new Date(), parser))).toBeTruthy();
  expect(vega.toDate('epoch', parser)).toBe(0);
});

test('toNumber parses numbers', function() {
  expect(vega.toNumber(null)).toBe(null);
  expect(vega.toNumber(undefined)).toBe(null);
  expect(vega.toNumber('')).toBe(null);
  expect(vega.toNumber('0')).toBe(0);
  expect(vega.toNumber('1')).toBe(1);
  expect(vega.toNumber('1e5')).toBe(1e5);
  expect(isNaN(vega.toNumber('foo'))).toBeTruthy();
  expect(vega.toNumber(0)).toBe(0);
  expect(vega.toNumber(1)).toBe(1);
  expect(vega.toNumber(1e5)).toBe(1e5);
  expect(vega.toNumber(true)).toBe(1);
  expect(vega.toNumber(false)).toBe(0);
});

test('toString parses strings', function() {
  expect(vega.toString(null)).toBe(null);
  expect(vega.toString(undefined)).toBe(null);
  expect(vega.toString('')).toBe(null);
  expect(vega.toString('a')).toBe('a');
  expect(vega.toString(0)).toBe('0');
  expect(vega.toString(1)).toBe('1');
  expect(vega.toString(true)).toBe('true');
  expect(vega.toString(false)).toBe('false');
});

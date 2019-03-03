var vega = require('../');

test('isArray tests arrays', function() {
  expect(vega.isArray([])).toBe(true);
  expect(vega.isArray({})).toBe(false);
  expect(vega.isArray('a')).toBe(false);
});

test('isBoolean tests booleans', function() {
  expect(vega.isBoolean(true)).toBe(true);
  expect(vega.isBoolean(false)).toBe(true);
  expect(vega.isBoolean({})).toBe(false);
  expect(vega.isBoolean('a')).toBe(false);
  expect(vega.isBoolean(0)).toBe(false);
});

test('isDate tests dates', function() {
  expect(vega.isDate(new Date())).toBe(true);
  expect(vega.isDate(Date.now())).toBe(false);
  expect(vega.isDate({})).toBe(false);
  expect(vega.isDate([])).toBe(false);
});

test('isFunction tests functions', function() {
  expect(vega.isFunction(function() { return 1; })).toBe(true);
  expect(vega.isFunction({})).toBe(false);
  expect(vega.isFunction(null)).toBe(false);
});

test('isNumber tests numbers', function() {
  expect(vega.isNumber(0)).toBe(true);
  expect(vega.isNumber(1e5)).toBe(true);
  expect(vega.isNumber(null)).toBe(false);
  expect(vega.isNumber('a')).toBe(false);
  expect(vega.isNumber('1')).toBe(false);
});

test('isObject tests objects', function() {
  expect(vega.isObject({})).toBe(true);
  expect(vega.isObject([])).toBe(true);
  expect(vega.isObject(new Date())).toBe(true);
  expect(vega.isObject(0)).toBe(false);
  expect(vega.isObject('a')).toBe(false);
  expect(vega.isObject(true)).toBe(false);
});

test('isRegExp tests regular expressions', function() {
  expect(vega.isRegExp(/grep+/)).toBe(true);
  expect(vega.isRegExp(null)).toBe(false);
  expect(vega.isRegExp('a')).toBe(false);
});

test('isString tests strings', function() {
  expect(vega.isString('')).toBe(true);
  expect(vega.isString('a')).toBe(true);
  expect(vega.isString([])).toBe(false);
  expect(vega.isString(0)).toBe(false);
});

var tape = require('tape'),
    vega = require('../');

tape('isArray tests arrays', function(test) {
  test.equal(vega.isArray([]), true);
  test.equal(vega.isArray({}), false);
  test.equal(vega.isArray('a'), false);
  test.end();
});

tape('isBoolean tests booleans', function(test) {
  test.equal(vega.isBoolean(true), true);
  test.equal(vega.isBoolean(false), true);
  test.equal(vega.isBoolean({}), false);
  test.equal(vega.isBoolean('a'), false);
  test.equal(vega.isBoolean(0), false);
  test.end();
});

tape('isDate tests dates', function(test) {
  test.equal(vega.isDate(new Date()), true);
  test.equal(vega.isDate(Date.now()), false);
  test.equal(vega.isDate({}), false);
  test.equal(vega.isDate([]), false);
  test.end();
});

tape('isFunction tests functions', function(test) {
  test.equal(vega.isFunction(function() { return 1; }), true);
  test.equal(vega.isFunction({}), false);
  test.equal(vega.isFunction(null), false);
  test.end();
});

tape('isNumber tests numbers', function(test) {
  test.equal(vega.isNumber(0), true);
  test.equal(vega.isNumber(1e5), true);
  test.equal(vega.isNumber(null), false);
  test.equal(vega.isNumber('a'), false);
  test.equal(vega.isNumber('1'), false);
  test.end();
});

tape('isObject tests objects', function(test) {
  test.equal(vega.isObject({}), true);
  test.equal(vega.isObject([]), true);
  test.equal(vega.isObject(new Date()), true);
  test.equal(vega.isObject(0), false);
  test.equal(vega.isObject('a'), false);
  test.equal(vega.isObject(true), false);
  test.end();
});

tape('isRegExp tests regular expressions', function(test) {
  test.equal(vega.isRegExp(/grep+/), true);
  test.equal(vega.isRegExp(null), false);
  test.equal(vega.isRegExp('a'), false);
  test.end();
});

tape('isString tests strings', function(test) {
  test.equal(vega.isString(''), true);
  test.equal(vega.isString('a'), true);
  test.equal(vega.isString([]), false);
  test.equal(vega.isString(0), false);
  test.end();
});

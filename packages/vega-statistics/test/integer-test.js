var integer = require('../').randomInteger;

test('integer generates random values', function() {
  var s = integer(10).sample();
  expect(0 <= s && s < 10).toBeTruthy();
  expect(s).toBe(~~s);

  s = integer(5, 10).sample();
  expect(5 <= s && s < 10).toBeTruthy();
  expect(s).toBe(~~s);
});

test('integer evaluates the pdf', function() {
  var n1 = integer(0, 5);
  expect(n1.pdf(-1)).toBe(0.0);
  expect(n1.pdf(5)).toBe(0.0);
  expect(n1.pdf(0)).toBe(0.2);
  expect(n1.pdf(1)).toBe(0.2);
  expect(n1.pdf(2)).toBe(0.2);
  expect(n1.pdf(3)).toBe(0.2);
  expect(n1.pdf(4)).toBe(0.2);
});

test('integer evaluates the cdf', function() {
  var n1 = integer(0, 5);
  expect(n1.cdf(-1)).toBe(0.0);
  expect(n1.cdf(0)).toBe(0.2);
  expect(n1.cdf(1)).toBe(0.4);
  expect(n1.cdf(2)).toBe(0.6);
  expect(n1.cdf(3)).toBe(0.8);
  expect(n1.cdf(4)).toBe(1.0);
  expect(n1.cdf(5)).toBe(1.0);
});

test('integer evaluates the inverse cdf', function() {
  var n1 = integer(0, 5);
  // extreme values
  expect(isNaN(n1.icdf(-1))).toBeTruthy();
  expect(isNaN(n1.icdf(2))).toBeTruthy();
  // in range values
  expect(n1.icdf(0)).toBe(-1);
  expect(n1.icdf(0.2)).toBe(0);
  expect(n1.icdf(0.4)).toBe(1);
  expect(n1.icdf(0.6)).toBe(2);
  expect(n1.icdf(0.8)).toBe(3);
  expect(n1.icdf(1.0)).toBe(4);
});

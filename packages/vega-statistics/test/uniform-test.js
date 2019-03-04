var uniform = require('../').randomUniform;

test('uniform generates random values', function() {
  var s = uniform().sample();
  expect(s >= 0 && s < 1).toBeTruthy();

  s = uniform(10).sample();
  expect(s >= 0 && s < 10).toBeTruthy();

  s = uniform(5, 10).sample();
  expect(s >= 5 && s < 10).toBeTruthy();
});

test('uniform evaluates the pdf', function() {
  var n1 = uniform(-1, 1);
  expect(n1.pdf(-2)).toBe(0.0);
  expect(n1.pdf(2)).toBe(0.0);
  expect(n1.pdf(0)).toBe(0.5);
  expect(n1.pdf(-0.5)).toBe(n1.pdf(0.5));
  expect(n1.pdf(-1)).toBe(n1.pdf(1));
});

test('uniform evaluates the cdf', function() {
  var n1 = uniform(-1, 1);
  // extreme values
  expect(n1.cdf(-2)).toBe(0);
  expect(n1.cdf(2)).toBe(1);
  // in range values
  expect(n1.cdf(0)).toBe(0.50);
  expect(n1.cdf(-0.5)).toBe(0.25);
  expect(n1.cdf(0.5)).toBe(0.75);
});

test('uniform evaluates the inverse cdf', function() {
  var n1 = uniform(-1, 1);
  // extreme values
  expect(isNaN(n1.icdf(-2))).toBeTruthy();
  expect(isNaN(n1.icdf(2))).toBeTruthy();
  expect(n1.icdf(0)).toBe(-1);
  expect(n1.icdf(1)).toBe(1);
  // in range values
  expect(n1.icdf(0.5)).toBe(0);
  expect(n1.icdf(0.25)).toBe(-0.5);
  expect(n1.icdf(0.75)).toBe(0.5);
});

var vega = require('../');

test('lerp linearly interpolates numbers', function() {
  const a = [0, 100],
        b = [100, 0];

  // invalid fraction values
  expect(vega.lerp(a, null)).toBe(0);
  expect(vega.lerp(a, undefined)).toBe(0);
  expect(vega.lerp(a, NaN)).toBe(0);

  // increasing array values
  expect(vega.lerp(a, 0.00)).toBe(0);
  expect(vega.lerp(a, 0.01)).toBe(1);
  expect(vega.lerp(a, 0.20)).toBe(20);
  expect(vega.lerp(a, 0.50)).toBe(50);
  expect(vega.lerp(a, 0.80)).toBe(80);
  expect(vega.lerp(a, 0.99)).toBe(99);
  expect(vega.lerp(a, 1.00)).toBe(100);
  expect(vega.lerp(a, -1)).toBe(-100);
  expect(vega.lerp(a,  2)).toBe(200);

  // decreasing array values
  expect(vega.lerp(b, 0.00)).toBe(100);
  expect(vega.lerp(b, 0.01)).toBe(99);
  expect(vega.lerp(b, 0.20)).toBe(80);
  expect(vega.lerp(b, 0.50)).toBe(50);
  expect(vega.lerp(b, 0.80)).toBe(20);
  expect(vega.lerp(b, 0.99)).toBe(1);
  expect(vega.lerp(b, 1.00)).toBe(0);
  expect(vega.lerp(b, -1)).toBe(200);
  expect(vega.lerp(b,  2)).toBe(-100);
});

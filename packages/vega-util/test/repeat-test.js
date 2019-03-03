var vega = require('../');

test('repeat repeats strings', function() {
  expect(vega.repeat('1', 0)).toBe('');
  expect(vega.repeat('1', 1)).toBe('1');
  expect(vega.repeat('1', 3)).toBe('111');
  expect(vega.repeat('1', 1)).toBe('1');
  expect(vega.repeat('1', -1)).toBe('');
  expect(vega.repeat('1')).toBe('');
});

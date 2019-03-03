var vega = require('../');

test('truncate truncates strings', function() {
  // should reduce string length
  expect(vega.truncate('123456789', 5)).toBe('1234…');
  expect(vega.truncate('123456789', 5, null, '')).toBe('12345');

  // should respect position argument
  expect(vega.truncate('123456789', 5, 'right')).toBe('1234…');
  expect(vega.truncate('123456789', 5, 'left')).toBe('…6789');
  expect(vega.truncate('123456789', 5, 'center')).toBe('12…89');
});

test('truncate truncates numbers', function() {
  // should reduce length
  expect(vega.truncate(123456789, 5)).toBe('1234…');
  expect(vega.truncate(123456789, 5, null, '')).toBe('12345');

  // should respect position argument
  expect(vega.truncate(123456789, 5, 'right')).toBe('1234…');
  expect(vega.truncate(123456789, 5, 'left')).toBe('…6789');
  expect(vega.truncate(123456789, 5, 'center')).toBe('12…89');
});

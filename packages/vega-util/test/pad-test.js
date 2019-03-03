var vega = require('../');

test('pad pads strings', function() {
  // should increase string length
  expect(vega.pad('12345', 8)).toBe('12345   ');
  expect(vega.pad('12345', 8, '!')).toBe('12345!!!');

  // should return longer inputs as-is
  expect(vega.pad('12345', 3)).toBe('12345');

  // should respect align argument
  expect(vega.pad('12345', 8, ' ', 'right')).toBe('12345   ');
  expect(vega.pad('12345', 8, ' ', 'left')).toBe('   12345');
  expect(vega.pad('12345', 8, ' ', 'center')).toBe(' 12345  ');
});

test('pad pads numbers', function() {
  // should increase string length
  expect(vega.pad(12345, 8)).toBe('12345   ');
  expect(vega.pad(12345, 8, '!')).toBe('12345!!!');

  // should return longer inputs as-is
  expect(vega.pad(12345, 3)).toBe('12345');

  // should respect align argument
  expect(vega.pad(12345, 8, ' ', 'right')).toBe('12345   ');
  expect(vega.pad(12345, 8, ' ', 'left')).toBe('   12345');
  expect(vega.pad(12345, 8, ' ', 'center')).toBe(' 12345  ');
});

var vega = require('../');

test('peek returns last element of a sequence', function() {
  expect(vega.peek([1])).toBe(1);
  expect(vega.peek([1,2,3])).toBe(3);
  expect(vega.peek([])).toBe(undefined);
  expect(vega.peek('1')).toBe('1');
  expect(vega.peek('123')).toBe('3');
  expect(vega.peek('')).toBe(undefined);
});

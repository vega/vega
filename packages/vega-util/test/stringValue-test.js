var vega = require('../');

test('stringValue maps values', function() {
  // should wrap string arguments in double quotation marks
  expect(vega.stringValue('test')).toBe('"test"');

  // should wrap arrays in square brackets
  expect(vega.stringValue(['1', '2'])).toBe('["1","2"]');

  // should return boolean arguments as they are
  expect(vega.stringValue(true)).toBe(true);
  expect(vega.stringValue(false)).toBe(false);

  // should return number arguments as they are
  expect(vega.stringValue(2)).toBe(2);
  expect(vega.stringValue(-2)).toBe(-2);
  expect(vega.stringValue(-5.32)).toBe(-5.32);

  // should recursively wrap arrays in square brackets
  expect(vega.stringValue([['1', 3], '2'])).toBe('[["1",3],"2"]');

  // should stringify objects
  var x = {a: {b: {c: 1}}};
  expect(JSON.stringify(x)).toBe(vega.stringValue(x));

  // should handle quotes in strings
  var tests = ["'hello'", '"hello"'];
  tests.forEach(function(s) {
    expect(s).toBe(eval(vega.stringValue(s)));
  });

  // should handle special characters in strings
  tests = ["\ntest", // newline
    '\u0000',
    '\u2028', // line separator
    '\u2029' // paragraph separator
  ];
  tests.forEach(function(s) {
    expect(s).toBe(eval(vega.stringValue(s)));
  });
});

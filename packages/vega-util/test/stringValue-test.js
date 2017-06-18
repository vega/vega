var tape = require('tape'),
    vega = require('../');

tape('stringValue maps values', function(test) {
  // should wrap string arguments in double quotation marks
  test.strictEqual(vega.stringValue('test'), '"test"');

  // should wrap arrays in square brackets
  test.equal(vega.stringValue(['1', '2']), '["1","2"]');

  // should return boolean arguments as they are
  test.equal(vega.stringValue(true), true);
  test.equal(vega.stringValue(false), false);

  // should return number arguments as they are
  test.equal(vega.stringValue(2), 2);
  test.equal(vega.stringValue(-2), -2);
  test.equal(vega.stringValue(-5.32), -5.32);

  // should recursively wrap arrays in square brackets
  test.equal(vega.stringValue([['1', 3], '2']), '[["1",3],"2"]');

  // should stringify objects
  var x = {a: {b: {c: 1}}};
  test.equal(JSON.stringify(x), vega.stringValue(x));

  // should handle quotes in strings
  var tests = ["'hello'", '"hello"'];
  tests.forEach(function(s) {
    test.equal(s, eval(vega.stringValue(s)));
  });

  // should handle special characters in strings
  tests = ["\ntest", // newline
    '\u0000',
    '\u2028', // line separator
    '\u2029' // paragraph separator
  ];
  tests.forEach(function(s) {
    test.equal(s, eval(vega.stringValue(s)));
  });

  test.end();
});

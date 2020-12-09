var tape = require('tape'),
    vega = require('../');

tape('stringValue maps values', t => {
  // should wrap string arguments in double quotation marks
  t.strictEqual(vega.stringValue('test'), '"test"');

  // should wrap arrays in square brackets
  t.equal(vega.stringValue(['1', '2']), '["1","2"]');

  // should return boolean arguments as they are
  t.equal(vega.stringValue(true), true);
  t.equal(vega.stringValue(false), false);

  // should return number arguments as they are
  t.equal(vega.stringValue(2), 2);
  t.equal(vega.stringValue(-2), -2);
  t.equal(vega.stringValue(-5.32), -5.32);

  // should recursively wrap arrays in square brackets
  t.equal(vega.stringValue([['1', 3], '2']), '[["1",3],"2"]');

  // should stringify objects
  const x = {a: {b: {c: 1}}};
  t.equal(JSON.stringify(x), vega.stringValue(x));

  // should handle quotes in strings
  let tests = ["'hello'", '"hello"'];
  tests.forEach(s => {
    t.equal(s, eval(vega.stringValue(s)));
  });

  // should handle special characters in strings
  tests = ['\ntest', // newline
    '\u0000',
    '\u2028', // line separator
    '\u2029' // paragraph separator
  ];
  tests.forEach(s => {
    t.equal(s, eval(vega.stringValue(s)));
  });

  t.end();
});

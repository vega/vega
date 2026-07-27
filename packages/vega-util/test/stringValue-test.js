import tape from 'tape';
import * as vega from '../build/index.js';

tape('stringValue maps values', t => {
  // should wrap string arguments in double quotation marks
  t.strictEqual(vega.stringValue('test'), '"test"');

  // should wrap arrays in square brackets
  t.equal(vega.stringValue(['1', '2']), '["1","2"]');

  // should return boolean arguments as they are
  t.equal(vega.stringValue(true), true);
  t.equal(vega.stringValue(false), false);

  // should handle null
  t.equal(vega.stringValue(null), null);

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
  const tests = ["'hello'", '"hello"'];
  tests.forEach(s => {
    t.equal(s, eval(vega.stringValue(s)));
  });

  // should handle arrays and nulls
  const a = [123, 'hello', null];
  t.equal(JSON.stringify(a), vega.stringValue(a));

  // should replace all instances of problematic Unicode characters
  // \n = newline, \u0000 = null char, \u2028 = line separator, \u2029 = paragraph separator
  t.equal(vega.stringValue('\n \u0000 \u2028 \u2029 \u2029'), '"\\n \\u0000 \\u2028 \\u2029 \\u2029"');

  t.end();
});

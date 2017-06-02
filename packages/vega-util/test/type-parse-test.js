var tape = require('tape'),
    vega = require('../');

tape('toBoolean parses booleans', function(test) {
  test.equal(vega.toBoolean(null), null);
  test.equal(vega.toBoolean(undefined), null);
  test.equal(vega.toBoolean(''), null);
  test.equal(vega.toBoolean('false'), false);
  test.equal(vega.toBoolean('true'), true);
  test.equal(vega.toBoolean('foo'), true);
  test.equal(vega.toBoolean('1'), true);
  test.equal(vega.toBoolean('0'), false);
  test.equal(vega.toBoolean(0), false);
  test.equal(vega.toBoolean(1), true);
  test.equal(vega.toBoolean(false), false);
  test.equal(vega.toBoolean(true), true);
  test.end();
});

tape('toDate parses dates', function(test) {
  var now = Date.now(),
      d = new Date(now);

  test.equal(vega.toDate(null), null);
  test.equal(vega.toDate(undefined), null);
  test.equal(vega.toDate(''), null);
  test.equal(vega.toDate('1/1/2000'), Date.parse('1/1/2000'));
  test.ok(isNaN(vega.toDate('foo')));
  test.equal(vega.toDate(0), 0);
  test.equal(vega.toDate(1), 1);
  test.equal(vega.toDate(now), now);
  test.equal(vega.toDate(d), d);
  test.ok(isNaN(vega.toDate(true)));
  test.ok(isNaN(vega.toDate(false)));
  test.end();
});

tape('toDate parses dates with custom parser', function(test) {
  function parser(_) {
    return _ === 'epoch' ? 0 : NaN;
  }

  test.equal(vega.toDate(null, parser), null);
  test.equal(vega.toDate(undefined, parser), null);
  test.equal(vega.toDate('', parser), null);
  test.ok(isNaN(vega.toDate('1/1/2000', parser)));
  test.ok(isNaN(vega.toDate('foo', parser)));
  test.ok(isNaN(vega.toDate(Date.now(), parser)));
  test.ok(isNaN(vega.toDate(new Date(), parser)));
  test.equal(vega.toDate('epoch', parser), 0);
  test.end();
});

tape('toNumber parses numbers', function(test) {
  test.equal(vega.toNumber(null), null);
  test.equal(vega.toNumber(undefined), null);
  test.equal(vega.toNumber(''), null);
  test.equal(vega.toNumber('0'), 0);
  test.equal(vega.toNumber('1'), 1);
  test.equal(vega.toNumber('1e5'), 1e5);
  test.ok(isNaN(vega.toNumber('foo')));
  test.equal(vega.toNumber(0), 0);
  test.equal(vega.toNumber(1), 1);
  test.equal(vega.toNumber(1e5), 1e5);
  test.equal(vega.toNumber(true), 1);
  test.equal(vega.toNumber(false), 0);
  test.end();
});

tape('toString parses strings', function(test) {
  test.equal(vega.toString(null), null);
  test.equal(vega.toString(undefined), null);
  test.equal(vega.toString(''), null);
  test.equal(vega.toString('a'), 'a');
  test.equal(vega.toString(0), '0');
  test.equal(vega.toString(1), '1');
  test.equal(vega.toString(true), 'true');
  test.equal(vega.toString(false), 'false');
  test.end();
});

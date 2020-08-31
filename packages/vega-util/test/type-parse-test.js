var tape = require('tape'),
    vega = require('../');

tape('toBoolean parses booleans', t => {
  t.equal(vega.toBoolean(null), null);
  t.equal(vega.toBoolean(undefined), null);
  t.equal(vega.toBoolean(''), null);
  t.equal(vega.toBoolean('false'), false);
  t.equal(vega.toBoolean('true'), true);
  t.equal(vega.toBoolean('foo'), true);
  t.equal(vega.toBoolean('1'), true);
  t.equal(vega.toBoolean('0'), false);
  t.equal(vega.toBoolean(0), false);
  t.equal(vega.toBoolean(1), true);
  t.equal(vega.toBoolean(false), false);
  t.equal(vega.toBoolean(true), true);
  t.end();
});

tape('toDate parses dates', t => {
  var now = Date.now(),
      d = new Date(now);

  t.equal(vega.toDate(null), null);
  t.equal(vega.toDate(undefined), null);
  t.equal(vega.toDate(''), null);
  t.equal(vega.toDate('1/1/2000'), Date.parse('1/1/2000'));
  t.ok(Number.isNaN(vega.toDate('foo')));
  t.equal(vega.toDate(0), 0);
  t.equal(vega.toDate(1), 1);
  t.equal(vega.toDate(now), now);
  t.equal(vega.toDate(d), d);
  t.ok(Number.isNaN(vega.toDate(true)));
  t.ok(Number.isNaN(vega.toDate(false)));
  t.end();
});

tape('toDate parses dates with custom parser', t => {
  function parser(_) {
    return _ === 'epoch' ? 0 : NaN;
  }

  t.equal(vega.toDate(null, parser), null);
  t.equal(vega.toDate(undefined, parser), null);
  t.equal(vega.toDate('', parser), null);
  t.ok(Number.isNaN(vega.toDate('1/1/2000', parser)));
  t.ok(Number.isNaN(vega.toDate('foo', parser)));
  t.ok(Number.isNaN(vega.toDate(Date.now(), parser)));
  t.ok(Number.isNaN(vega.toDate(new Date(), parser)));
  t.equal(vega.toDate('epoch', parser), 0);
  t.end();
});

tape('toNumber parses numbers', t => {
  t.equal(vega.toNumber(null), null);
  t.equal(vega.toNumber(undefined), null);
  t.equal(vega.toNumber(''), null);
  t.equal(vega.toNumber('0'), 0);
  t.equal(vega.toNumber('1'), 1);
  t.equal(vega.toNumber('1e5'), 1e5);
  t.ok(Number.isNaN(vega.toNumber('foo')));
  t.equal(vega.toNumber(0), 0);
  t.equal(vega.toNumber(1), 1);
  t.equal(vega.toNumber(1e5), 1e5);
  t.equal(vega.toNumber(true), 1);
  t.equal(vega.toNumber(false), 0);
  t.end();
});

tape('toString parses strings', t => {
  t.equal(vega.toString(null), null);
  t.equal(vega.toString(undefined), null);
  t.equal(vega.toString(''), null);
  t.equal(vega.toString('a'), 'a');
  t.equal(vega.toString(0), '0');
  t.equal(vega.toString(1), '1');
  t.equal(vega.toString(true), 'true');
  t.equal(vega.toString(false), 'false');
  t.end();
});

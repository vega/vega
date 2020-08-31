var tape = require('tape'),
    vega = require('../');

tape('peek returns last element of a sequence', t => {
  t.equal(vega.peek([1]), 1);
  t.equal(vega.peek([1,2,3]), 3);
  t.equal(vega.peek([]), undefined);
  t.equal(vega.peek('1'), '1');
  t.equal(vega.peek('123'), '3');
  t.equal(vega.peek(''), undefined);
  t.end();
});

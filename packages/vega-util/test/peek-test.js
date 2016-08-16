var tape = require('tape'),
    vega = require('../');

tape('peek returns last element of a sequence', function(test) {
  test.equal(vega.peek([1]), 1);
  test.equal(vega.peek([1,2,3]), 3);
  test.equal(vega.peek([]), undefined);
  test.equal(vega.peek('1'), '1');
  test.equal(vega.peek('123'), '3');
  test.equal(vega.peek(''), undefined);
  test.end();
});

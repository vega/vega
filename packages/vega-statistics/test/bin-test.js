var tape = require('tape'),
    bin = require('../').bin;

tape('bin generates boundaries for exact step size', function(test) {
  var b = bin({extent:[1.3, 10.2], step:1, nice:false});
  test.equal(b.start, 1.3);
  test.equal(b.stop, 10.2);
  test.equal(b.step, 1);

  b = bin({extent:[1.3, 10.2], step:1, nice:true});
  test.equal(b.start, 1);
  test.equal(b.stop, 11);
  test.equal(b.step, 1);

  b = bin({extent:[99.2258064516129, 2307.451612903226], step:50, nice:true});
  test.equal(b.start, 50);
  test.equal(b.stop, 2350);
  test.equal(b.step, 50);

  test.end();
});

tape('bin generates boundaries for inferred step size', function(test) {
  var b = bin({extent:[1.3, 10.2], maxbins:10, nice:false});
  test.equal(b.start, 1.3);
  test.equal(b.stop, 10.2);
  test.equal(b.step, 1);

  b = bin({extent:[1.3, 10.2], maxbins:10, nice:true});
  test.equal(b.start, 1);
  test.equal(b.stop, 11);
  test.equal(b.step, 1);

  b = bin({extent:[99.2258064516129, 2307.451612903226], maxbins:30});
  test.equal(b.start, 0);
  test.equal(b.stop, 2400);
  test.equal(b.step, 100);

  b = bin({extent:[99.2258064516129, 2307.451612903226], maxbins:64});
  test.equal(b.start, 50);
  test.equal(b.stop, 2350);
  test.equal(b.step, 50);

  test.end();
});

tape('bin generates boundaries with minimum step size', function(test) {
  var b = bin({extent:[0, 10], minstep:1, maxbins:100});
  test.equal(b.start, 0);
  test.equal(b.stop, 10);
  test.equal(b.step, 1);

  test.end();
});

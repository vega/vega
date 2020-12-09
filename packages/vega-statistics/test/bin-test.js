var tape = require('tape'),
    bin = require('../').bin;

tape('bin generates boundaries for exact step size', t => {
  let b = bin({extent:[1.3, 10.2], step:1, nice:false});
  t.equal(b.start, 1.3);
  t.equal(b.stop, 10.2);
  t.equal(b.step, 1);

  b = bin({extent:[1.3, 10.2], step:1, nice:true});
  t.equal(b.start, 1);
  t.equal(b.stop, 11);
  t.equal(b.step, 1);

  b = bin({extent:[99.2258064516129, 2307.451612903226], step:50, nice:true});
  t.equal(b.start, 50);
  t.equal(b.stop, 2350);
  t.equal(b.step, 50);

  t.end();
});

tape('bin generates boundaries for zero-span extent', t => {
  let b = bin({extent: [1, 1], maxbins: 1});
  t.equal(b.start, 1);
  t.equal(b.stop, 2);
  t.equal(b.step, 1);

  b = bin({extent: [0, 0], maxbins: 1});
  t.equal(b.start, 0);
  t.equal(b.stop, 1);
  t.equal(b.step, 1);

  b = bin({extent: [1, 1], maxbins: 10});
  t.equal(b.start, 1);
  t.equal(b.stop, 1.1);
  t.equal(b.step, 0.1);

  b = bin({extent: [0, 0], maxbins: 10});
  t.equal(b.start, 0);
  t.equal(b.stop, 0.1);
  t.equal(b.step, 0.1);

  t.end();
});

tape('bin generates boundaries for inferred step size', t => {
  let b = bin({extent:[1.3, 10.2], maxbins:10, nice:false});
  t.equal(b.start, 1.3);
  t.equal(b.stop, 10.2);
  t.equal(b.step, 1);

  b = bin({extent:[1.3, 10.2], maxbins:10, nice:true});
  t.equal(b.start, 1);
  t.equal(b.stop, 11);
  t.equal(b.step, 1);

  b = bin({extent:[99.2258064516129, 2307.451612903226], maxbins:30});
  t.equal(b.start, 0);
  t.equal(b.stop, 2400);
  t.equal(b.step, 100);

  b = bin({extent:[99.2258064516129, 2307.451612903226], maxbins:64});
  t.equal(b.start, 50);
  t.equal(b.stop, 2350);
  t.equal(b.step, 50);

  t.end();
});

tape('bin generates boundaries with minimum step size', t => {
  const b = bin({extent:[0, 10], minstep:1, maxbins:100});
  t.equal(b.start, 0);
  t.equal(b.stop, 10);
  t.equal(b.step, 1);

  t.end();
});

tape('bin generates boundaries for given span size', t => {
  let b = bin({extent:[0, 100], span:10, maxbins:10, nice:false});
  t.equal(b.start, 0);
  t.equal(b.stop, 100);
  t.equal(b.step, 1);

  b = bin({extent:[0, 100], span:1, maxbins:20, nice:false});
  t.equal(b.start, 0);
  t.equal(b.stop, 100);
  t.equal(b.step, 0.05);

  b = bin({extent:[0, 100], span:100, maxbins:10, nice:false});
  t.equal(b.start, 0);
  t.equal(b.stop, 100);
  t.equal(b.step, 10);

  t.end();
});

var bin = require('../').bin;

test('bin generates boundaries for exact step size', function() {
  var b = bin({extent:[1.3, 10.2], step:1, nice:false});
  expect(b.start).toBe(1.3);
  expect(b.stop).toBe(10.2);
  expect(b.step).toBe(1);

  b = bin({extent:[1.3, 10.2], step:1, nice:true});
  expect(b.start).toBe(1);
  expect(b.stop).toBe(11);
  expect(b.step).toBe(1);

  b = bin({extent:[99.2258064516129, 2307.451612903226], step:50, nice:true});
  expect(b.start).toBe(50);
  expect(b.stop).toBe(2350);
  expect(b.step).toBe(50);
});

test('bin generates boundaries for inferred step size', function() {
  var b = bin({extent:[1.3, 10.2], maxbins:10, nice:false});
  expect(b.start).toBe(1.3);
  expect(b.stop).toBe(10.2);
  expect(b.step).toBe(1);

  b = bin({extent:[1.3, 10.2], maxbins:10, nice:true});
  expect(b.start).toBe(1);
  expect(b.stop).toBe(11);
  expect(b.step).toBe(1);

  b = bin({extent:[99.2258064516129, 2307.451612903226], maxbins:30});
  expect(b.start).toBe(0);
  expect(b.stop).toBe(2400);
  expect(b.step).toBe(100);

  b = bin({extent:[99.2258064516129, 2307.451612903226], maxbins:64});
  expect(b.start).toBe(50);
  expect(b.stop).toBe(2350);
  expect(b.step).toBe(50);
});

test('bin generates boundaries with minimum step size', function() {
  var b = bin({extent:[0, 10], minstep:1, maxbins:100});
  expect(b.start).toBe(0);
  expect(b.stop).toBe(10);
  expect(b.step).toBe(1);
});

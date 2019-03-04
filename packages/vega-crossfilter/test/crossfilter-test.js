var util = require('vega-util'), vega = require('vega-dataflow'), xf = require('../'), changeset = vega.changeset, Collect = require('vega-transforms').collect, CrossFilter = xf.crossfilter, ResolveFilter = xf.resolvefilter;

test('Crossfilter filters tuples', function() {
  var data = [
    {a: 1, b: 1, c:0}, {a: 2, b: 2, c:1},
    {a: 4, b: 4, c:2}, {a: 3, b: 3, c:3}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      df = new vega.Dataflow(),
      r1 = df.add([0, 5]),
      r2 = df.add([0, 5]),
      c0 = df.add(Collect),
      cf = df.add(CrossFilter, {fields:[a,b], query:[r1,r2], pulse:c0}),
      f1 = df.add(ResolveFilter, {ignore:2, filter:cf, pulse:cf}),
      o1 = df.add(Collect, {pulse: f1}),
      f2 = df.add(ResolveFilter, {ignore:1, filter:cf, pulse:cf}),
      o2 = df.add(Collect, {pulse: f2}),
      fn = df.add(ResolveFilter, {ignore:0, filter:cf, pulse:cf}),
      on = df.add(Collect, {pulse: fn});

  // -- add data
  df.pulse(c0, changeset().insert(data)).run();
  expect(o1.value.length).toBe(4);
  expect(o2.value.length).toBe(4);
  expect(on.value.length).toBe(4);

  // -- update single query
  df.update(r2, [1,2]).run();
  expect(o1.value.length).toBe(4);
  expect(o2.value.length).toBe(2);
  expect(on.value.length).toBe(2);

  // -- update multiple queries
  df.update(r1, [1,3])
    .update(r2, [3,4])
    .run();
  expect(o1.value.length).toBe(3);
  expect(o2.value.length).toBe(2);
  expect(on.value.length).toBe(1);

  // -- remove data
  df.pulse(c0, changeset().remove(data.slice(0, 2))).run();
  expect(o1.value.length).toBe(1);
  expect(o2.value.length).toBe(2);
  expect(on.value.length).toBe(1);

  // -- remove more data
  df.pulse(c0, changeset().remove(data.slice(-2))).run();
  expect(o1.value.length).toBe(0);
  expect(o2.value.length).toBe(0);
  expect(on.value.length).toBe(0);

  // -- add data back
  df.pulse(c0, changeset().insert(data)).run();
  expect(o1.value.length).toBe(3);
  expect(o2.value.length).toBe(2);
  expect(on.value.length).toBe(1);

  // -- modify non-indexed values
  df.pulse(c0, changeset()
    .modify(data[0], 'c', 5)
    .modify(data[3], 'c', 5)).run();
  expect(o1.value.length).toBe(3);
  expect(o2.value.length).toBe(2);
  expect(on.value.length).toBe(1);
  expect(o1.pulse.materialize().mod.length).toBe(2);
  expect(o2.pulse.materialize().mod.length).toBe(1);
  expect(on.pulse.materialize().mod.length).toBe(1);
});

test('Crossfilter consolidates after remove', function() {
  var data = [
    {a: 1, b: 1, c:0}, {a: 2, b: 2, c:1},
    {a: 4, b: 4, c:2}, {a: 3, b: 3, c:3}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      df = new vega.Dataflow(),
      r1 = df.add([0, 3]),
      r2 = df.add([0, 3]),
      c0 = df.add(Collect),
      cf = df.add(CrossFilter, {fields:[a,b], query:[r1,r2], pulse:c0});

  // -- add data
  df.pulse(c0, changeset().insert(data)).run();

  // -- remove data
  df.pulse(c0, changeset().remove(data.slice(0, 2))).run();

  // crossfilter consolidates after removal
  // this happens *after* propagation completes

  // were dimensions appropriately remapped?
  cf._dims.map(function(dim) {
    expect(dim.size()).toBe(2);

    var idx = dim.index();
    expect(idx[0]).toBe(1);
    expect(idx[1]).toBe(0);
  });

  // was the filter state appropriately updated?
  var d = cf.value.data(),
      curr = cf.value.curr();
  expect(cf.value.size()).toBe(2);
  expect(d[0]).toBe(data[2]);
  expect(d[1]).toBe(data[3]);
  expect(curr[0]).toBe((1 << 2) - 1); // first filter should fail all
  expect(curr[1]).toBe(0); // second filter should pass all
});

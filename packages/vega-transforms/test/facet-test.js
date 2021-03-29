var tape = require('tape'),
    {field, truthy} = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Facet = tx.facet;

tape('Facet facets tuples', t => {
  const data = [
    {k:'a', v:5}, {k:'b', v:7}, {k:'c', v:9},
    {k:'a', v:1}, {k:'b', v:2}, {k:'c', v:3}
  ];

  const subs = [];

  function subflow(df, key) {
    const col = df.add(Collect);
    subs.push({key: key, data: col});
    return col;
  }

  function subtest(len) {
    return function(s, i) {
      const d = s.data.value;
      t.equal(d.length, len === undefined ? i + 1 : len);
      t.equal(d.every(t => t.k === s.key), true);
    };
  }

  var key = field('k'),
      df = new vega.Dataflow(),
      source = df.add(Collect),
      facet = df.add(Facet, {subflow:subflow, key:key, pulse:source});

  // -- test adds
  df.pulse(source, changeset()
    .insert(data)
  ).run();
  t.equal(facet.targets().active, 3); // 3 subflows updated
  t.equal(subs.length, 3); // 3 subflows added
  subs.forEach(subtest(2)); // each subflow should have 2 tuples

  // -- test mods - key change
  df.pulse(source, changeset()
    .modify(data[3], 'k', 'c')
  ).run();
  t.equal(facet.targets().active, 2); // 2 subflows updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  // -- test mods - value change
  df.pulse(source, changeset()
    .modify(data[1], 'v', 100)
  ).run();
  t.equal(facet.targets().active, 1); // 1 subflow updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  // -- test rems - no disconnects
  df.pulse(source, changeset()
    .remove([data[2], data[3], data[4]])
  ).run();
  t.equal(facet.targets().active, 2); // 2 subflows updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest(1)); // each subflow should have 1 tuple

  // -- test rems - empty out a subflow
  df.pulse(source, changeset()
    .remove([data[0], data[1], data[5]])
    .clean(false) // don't remove subflows
  ).run();
  t.equal(facet.targets().active, 3); // 3 subflows updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest(0)); // each subflow should now be empty

  // -- test adds - repopulate subflows
  df.pulse(source, changeset()
    .insert(data)
  ).run();
  t.equal(facet.targets().active, 3); // 3 subflows updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  // -- test adds - new subflow
  df.pulse(source, changeset()
    .insert([{k:'d', v:4}, {k:'d', v:8}, {k:'d', v:6}, {k:'d', v:0}])
  ).run();
  t.equal(facet.targets().active, 1); // 1 subflow updated
  t.equal(subs.length, 4); // 1 subflow added
  subs.forEach(subtest()); // subflows should have 1,2,3,4 tuples respectively

  // -- test rems - empty out a subflow with cleaning
  df.pulse(source, changeset()
    .remove(truthy)
    .clean(true) // remove subflows from internal map
  ).run();
  t.equal(facet.targets().active, 0); // empty subflows removed
  t.equal(subs.length, 4); // no new subflows added
  subs.forEach(subtest(0)); // each subflow should now be empty

  // -- test adds - repopulate subflows
  df.pulse(source, changeset()
    .insert(data)
  ).run();
  t.equal(facet.targets().active, 3); // 3 subflows updated
  t.equal(subs.length, 7); // three new subflows added
  subs.slice(0, 3).forEach(subtest(0)); // prior subflows should be empty
  subs.slice(-3).forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  t.end();
});

tape('Facet handles key parameter change', t => {
  const data = [
    {k1:'a', k2:'a', v:5}, {k1:'b', k2:'c', v:7}, {k1:'c', k2:'c', v:9},
    {k1:'a', k2:'a', v:1}, {k1:'b', k2:'b', v:2}, {k1:'c', k2:'b', v:3}
  ];

  const subs = [];

  function subflow(df, key) {
    const col = df.add(Collect);
    subs.push({key: key, data: col});
    return col;
  }

  function subtest(len) {
    return function(s, i) {
      const d = s.data.value;
      t.equal(d.length, len === undefined ? i + 1 : len);
      t.equal(d.every(t => t.k2 === s.key), true);
    };
  }

  var key1 = field('k1'),
      key2 = field('k2'),
      df = new vega.Dataflow(),
      source = df.add(Collect),
      facet = df.add(Facet, {subflow:subflow, key:key1, pulse:source});

  // -- add data
  df.pulse(source, changeset().insert(data)).run();

  facet._argval.set('key', -1, key2);
  df.touch(facet).run();
  t.equal(facet.targets().active, 2); // 2 subflows updated
  t.equal(subs.length, 3); // 3 subflows exist
  subs.forEach(subtest(2)); // subflows should have 2 tuples each

  t.end();
});

tape('Facet key cache does not leak memory', t => {
  var df = new vega.Dataflow(),
      c0 = df.add(Collect),
      ft = df.add(Facet, {subflow:subflow, key:field('key'), pulse:c0}),
      N = df.cleanThreshold + 1;

  function subflow(df) {
    return df.add(Collect);
  }

  function generate(n) {
    for (var data = [], i=0; i<n; ++i) {
      data.push({id: i, key: i % 4});
    }
    return data;
  }

  // burn in by filling up to threshold, then remove all
  df.pulse(c0, changeset().insert(generate(N))).run();
  df.pulse(c0, changeset().remove(truthy).clean(false)).run();
  t.equal(ft._keys.empty, 0, 'Zero empty map entries');

  // now test with explicit clean request
  df.pulse(c0, changeset().insert(generate(50))).run();
  df.pulse(c0, changeset().remove(truthy).clean(true)).run();
  t.equal(ft._keys.empty, 0, 'Zero empty map entries');

  t.end();
});

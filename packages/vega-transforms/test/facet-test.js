const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const tx = require('../');
const changeset = vega.changeset;
const Collect = tx.collect;
const Facet = tx.facet;

tape('Facet facets tuples', function (t) {
  const data = [
    {k: 'a', v: 5},
    {k: 'b', v: 7},
    {k: 'c', v: 9},
    {k: 'a', v: 1},
    {k: 'b', v: 2},
    {k: 'c', v: 3}
  ];

  const subs = [];

  function subflow(df, key) {
    const col = df.add(Collect);
    subs.push({key: key, data: col});
    return col;
  }

  function subtest(len) {
    return function (s, i) {
      const d = s.data.value;
      t.equal(d.length, len === undefined ? i + 1 : len);
      t.equal(
        d.every(function (t) {
          return t.k === s.key;
        }),
        true
      );
    };
  }

  const key = util.field('k');
  const df = new vega.Dataflow();
  const source = df.add(Collect);
  const facet = df.add(Facet, {subflow: subflow, key: key, pulse: source});

  // -- test adds
  df.pulse(source, changeset().insert(data)).run();
  t.equal(facet.targets().active, 3); // 3 subflows updated
  t.equal(subs.length, 3); // 3 subflows added
  subs.forEach(subtest(2)); // each subflow should have 2 tuples

  // -- test mods - key change
  df.pulse(source, changeset().modify(data[0], 'k', 'c')).run();
  t.equal(facet.targets().active, 2); // 2 subflows updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  // -- test mods - value change
  df.pulse(source, changeset().modify(data[1], 'v', 100)).run();
  t.equal(facet.targets().active, 1); // 1 subflow updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  // -- test rems - no disconnects
  df.pulse(source, changeset().remove([data[0], data[2], data[4]])).run();
  t.equal(facet.targets().active, 2); // 2 subflows updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest(1)); // each subflow should have 1 tuple

  // -- test rems - empty out a subflow
  df.pulse(source, changeset().remove([data[1], data[3], data[5]])).run();
  t.equal(facet.targets().active, 3); // 3 subflows updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest(0)); // each subflow should now be empty

  // -- test adds - repopulate subflows
  df.pulse(source, changeset().insert(data)).run();
  t.equal(facet.targets().active, 3); // 3 subflows updated
  t.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  // -- test adds - new subflow
  df.pulse(
    source,
    changeset().insert([
      {k: 'd', v: 4},
      {k: 'd', v: 8},
      {k: 'd', v: 6},
      {k: 'd', v: 0}
    ])
  ).run();
  t.equal(facet.targets().active, 1); // 1 subflow updated
  t.equal(subs.length, 4); // 1 subflow added
  subs.forEach(subtest()); // subflows should have 1,2,3,4 tuples respectively

  t.end();
});

tape('Facet handles key parameter change', function (t) {
  const data = [
    {k1: 'a', k2: 'a', v: 5},
    {k1: 'b', k2: 'c', v: 7},
    {k1: 'c', k2: 'c', v: 9},
    {k1: 'a', k2: 'a', v: 1},
    {k1: 'b', k2: 'b', v: 2},
    {k1: 'c', k2: 'b', v: 3}
  ];

  const subs = [];

  function subflow(df, key) {
    const col = df.add(Collect);
    subs.push({key: key, data: col});
    return col;
  }

  function subtest(len) {
    return function (s, i) {
      const d = s.data.value;
      t.equal(d.length, len === undefined ? i + 1 : len);
      t.equal(
        d.every(function (t) {
          return t.k2 === s.key;
        }),
        true
      );
    };
  }

  const key1 = util.field('k1');
  const key2 = util.field('k2');
  const df = new vega.Dataflow();
  const source = df.add(Collect);
  const facet = df.add(Facet, {subflow: subflow, key: key1, pulse: source});

  // -- add data
  df.pulse(source, changeset().insert(data)).run();

  facet._argval.set('key', -1, key2);
  df.touch(facet).run();
  t.equal(facet.targets().active, 2); // 2 subflows updated
  t.equal(subs.length, 3); // 3 subflows exist
  subs.forEach(subtest(2)); // subflows should have 2 tuples each

  t.end();
});

tape('Facet key cache does not leak memory', function (t) {
  const df = new vega.Dataflow();
  const c0 = df.add(Collect);
  const ft = df.add(Facet, {subflow: subflow, key: util.field('key'), pulse: c0});
  const n = df.cleanThreshold + 1;

  function subflow(df) {
    return df.add(Collect);
  }

  function generate() {
    const data = [];
    for (let i = 0; i < n; ++i) {
      data.push({id: i, key: i % 4});
    }
    return data;
  }

  // burn in by filling up to threshold, then remove all
  df.pulse(c0, changeset().insert(generate())).run();
  df.pulse(c0, changeset().remove(util.truthy)).run();
  t.equal(ft._keys.empty, 0, 'Zero empty map entries');

  t.end();
});

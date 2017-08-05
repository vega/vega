var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Facet = tx.facet;

tape('Facet facets tuples', function(test) {
  var data = [
    {k:'a', v:5}, {k:'b', v:7}, {k:'c', v:9},
    {k:'a', v:1}, {k:'b', v:2}, {k:'c', v:3}
  ];

  var subs = [];

  function subflow(df, key) {
    var col = df.add(Collect);
    subs.push({key: key, data: col});
    return col;
  }

  function subtest(len) {
    return function(s, i) {
      var d = s.data.value;
      test.equal(d.length, len===undefined ? i+1 : len);
      test.equal(d.every(function(t) { return t.k === s.key; }), true);
    }
  }

  var key = util.field('k'),
      df = new vega.Dataflow(),
      source = df.add(Collect),
      facet = df.add(Facet, {subflow:subflow, key:key, pulse:source});

  // -- test adds
  df.pulse(source, changeset().insert(data)).run();
  test.equal(facet.targets().active, 3); // 3 subflows updated
  test.equal(subs.length, 3); // 3 subflows added
  subs.forEach(subtest(2)); // each subflow should have 2 tuples

  // -- test mods - key change
  df.pulse(source, changeset().modify(data[0], 'k', 'c')).run();
  test.equal(facet.targets().active, 2); // 2 subflows updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  // -- test mods - value change
  df.pulse(source, changeset().modify(data[1], 'v', 100)).run();
  test.equal(facet.targets().active, 1); // 1 subflow updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  // -- test rems - no disconnects
  df.pulse(source, changeset().remove([data[0], data[2], data[4]])).run();
  test.equal(facet.targets().active, 2); // 2 subflows updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest(1)); // each subflow should have 1 tuple

  // -- test rems - empty out a subflow
  df.pulse(source, changeset().remove([data[1], data[3], data[5]])).run();
  test.equal(facet.targets().active, 3); // 3 subflows updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest(0)); // each subflow should now be empty

  // -- test adds - repopulate subflows
  df.pulse(source, changeset().insert(data)).run();
  test.equal(facet.targets().active, 3); // 3 subflows updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively

  // -- test adds - new subflow
  df.pulse(source, changeset().insert([
    {k:'d', v:4}, {k:'d', v:8}, {k:'d', v:6}, {k:'d', v:0}
  ])).run();
  test.equal(facet.targets().active, 1); // 1 subflow updated
  test.equal(subs.length, 4); // 1 subflow added
  subs.forEach(subtest()); // subflows should have 1,2,3,4 tuples respectively

  test.end();
});

tape("Facet handles key parameter change", function(test) {
  var data = [
    {k1:'a', k2:'a', v:5}, {k1:'b', k2:'c', v:7}, {k1:'c', k2:'c', v:9},
    {k1:'a', k2:'a', v:1}, {k1:'b', k2:'b', v:2}, {k1:'c', k2:'b', v:3}
  ];

  var subs = [];

  function subflow(df, key) {
    var col = df.add(Collect);
    subs.push({key: key, data: col});
    return col;
  }

  function subtest(len) {
    return function(s, i) {
      var d = s.data.value;
      test.equal(d.length, len===undefined ? i+1 : len);
      test.equal(d.every(function(t) { return t.k2 === s.key; }), true);
    }
  }

  var key1 = util.field('k1'),
      key2 = util.field('k2'),
      df = new vega.Dataflow(),
      source = df.add(Collect),
      facet = df.add(Facet, {subflow:subflow, key:key1, pulse:source});

  // -- add data
  df.pulse(source, changeset().insert(data)).run();

  facet._argval.set('key', -1, key2);
  df.touch(facet).run();
  test.equal(facet.targets().active, 2); // 2 subflows updated
  test.equal(subs.length, 3); // 3 subflows exist
  subs.forEach(subtest(2)); // subflows should have 2 tuples each

  test.end();
});

tape('Facet key cache does not leak memory', function(test) {
  var df = new vega.Dataflow(),
      c0 = df.add(Collect),
      ft = df.add(Facet, {subflow:subflow, key:util.field('key'), pulse:c0}),
      n = df.cleanThreshold + 1;

  function subflow(df) {
    return df.add(Collect);
  }

  function generate() {
    for (var data = [], i=0; i<n; ++i) {
      data.push({id: i, key: i % 4});
    }
    return data;
  }

  // burn in by filling up to threshold, then remove all
  df.pulse(c0, changeset().insert(generate())).run();
  df.pulse(c0, changeset().remove(util.truthy)).run();
  test.equal(ft._keys.empty, 0, 'Zero empty map entries');

  test.end();
});

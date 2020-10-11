var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    tupleid = vega.tupleid,
    Collect = tx.collect,
    PreFacet = tx.prefacet;

tape('PreFacet partitions pre-faceted tuple sets', t => {
  const data = [
    {'id': 'a', 'tuples': [{x:1},{x:2}]},
    {'id': 'b', 'tuples': [{x:3},{x:4}]},
    {'id': 'c', 'tuples': [{x:5},{x:6}]}
  ];

  const subs = [];

  function subflow(df, key) {
    const col = df.add(Collect);
    subs.push({key: key, data: col});
    return col;
  }

  function values(index) {
    return subs[index].data.value.map(_ => _.x);
  }

  var tuples = util.field('tuples'),
      df = new vega.Dataflow(),
      source = df.add(Collect),
      facet = df.add(PreFacet, {subflow:subflow, field:tuples, pulse:source});

  // -- test add
  df.pulse(source, changeset().insert(data)).run();
  t.equal(facet.targets().active, 3); // 3 subflows updated
  t.equal(subs.length, 3); // 3 subflows added
  t.equal(subs[0].key, tupleid(data[0]));
  t.equal(subs[1].key, tupleid(data[1]));
  t.equal(subs[2].key, tupleid(data[2]));
  t.deepEqual(values(0), [1, 2]);
  t.deepEqual(values(1), [3, 4]);
  t.deepEqual(values(2), [5, 6]);
  t.ok(tupleid(subs[0].data.value[0]));
  t.ok(tupleid(subs[0].data.value[1]));
  t.ok(tupleid(subs[1].data.value[0]));
  t.ok(tupleid(subs[1].data.value[1]));
  t.ok(tupleid(subs[2].data.value[0]));
  t.ok(tupleid(subs[2].data.value[1]));

  // -- test rem
  df.pulse(source, changeset().remove(data[0]).clean(false)).run();
  t.equal(facet.targets().active, 1); // 1 subflow updated
  t.equal(subs.length, 3); // no new subflows added
  t.deepEqual(values(0), []);
  t.deepEqual(values(1), [3, 4]);
  t.deepEqual(values(2), [5, 6]);

  // -- test add - repopulate subflow
  df.pulse(source, changeset().insert(data[0])).run();
  t.equal(facet.targets().active, 1); // 1 subflow updated
  t.equal(subs.length, 3); // no new subflows added
  t.deepEqual(values(0), [1, 2]);
  t.deepEqual(values(1), [3, 4]);
  t.deepEqual(values(2), [5, 6]);

  // -- test add - new subflow
  df.pulse(source, changeset()
    .insert({key: 'd', tuples: [{x:7}, {x:8}]}))
    .run();
  t.equal(facet.targets().active, 1); // 1 subflow updated
  t.equal(subs.length, 4); // 1 subflow added
  t.deepEqual(values(0), [1, 2]);
  t.deepEqual(values(1), [3, 4]);
  t.deepEqual(values(2), [5, 6]);
  t.deepEqual(values(3), [7, 8]);
  t.ok(tupleid(subs[3].data.value[0]));
  t.ok(tupleid(subs[3].data.value[1]));

  // -- test rem with garbage collection
  df.pulse(source, changeset().remove(util.truthy).clean(true)).run();
  t.equal(facet.targets().active, 0); // empty subflows removed
  t.equal(subs.length, 4); // no new subflows added
  t.deepEqual(values(0), []);
  t.deepEqual(values(1), []);
  t.deepEqual(values(2), []);
  t.deepEqual(values(3), []);

  // -- test add - new subflow
  df.pulse(source, changeset()
    .insert({key: 'd', tuples: [{x:1}, {x:2}]}))
    .run();
  t.equal(facet.targets().active, 1); // 1 subflow updated
  t.equal(subs.length, 5); // 1 subflow added
  t.deepEqual(values(4), [1, 2]);
  t.ok(tupleid(subs[4].data.value[0]));
  t.ok(tupleid(subs[4].data.value[1]));

  t.end();
});

tape('PreFacet raises error if tuple sets are modified', t => {
  const data = [
    {'id': 'a', 'tuples': [{x:1},{x:2}]},
    {'id': 'b', 'tuples': [{x:3},{x:4}]},
    {'id': 'c', 'tuples': [{x:5},{x:6}]}
  ];

  function subflow(df) {
    return df.add(Collect);
  }

  var tuples = util.field('tuples'),
      df = new vega.Dataflow(),
      source = df.add(Collect);

  df.error = function(e) { throw e; };
  df.add(PreFacet, {subflow:subflow, field:tuples, pulse:source});

  // -- add
  df.pulse(source, changeset().insert(data)).run();

  // -- test mod contents
  df.pulse(source, changeset().modify(data[0], 'tuples', []))
    .runAsync()
    .then(() => t.ok(false, 'should not reach'))
    .catch(() => t.ok(true, 'should reach'))
    .then(() => t.end());
});

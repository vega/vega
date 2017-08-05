var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    tupleid = vega.tupleid,
    Collect = tx.collect,
    PreFacet = tx.prefacet;

tape('PreFacet partitions pre-faceted tuple sets', function(test) {
  var data = [
    {"id": "a", "tuples": [{x:1},{x:2}]},
    {"id": "b", "tuples": [{x:3},{x:4}]},
    {"id": "c", "tuples": [{x:5},{x:6}]}
  ];

  var subs = [];

  function subflow(df, key) {
    var col = df.add(Collect);
    subs.push({key: key, data: col});
    return col;
  }

  function values(index) {
    return subs[index].data.value.map(function(_) { return _.x; });
  }

  var tuples = util.field('tuples'),
      df = new vega.Dataflow(),
      source = df.add(Collect),
      facet = df.add(PreFacet, {subflow:subflow, field:tuples, pulse:source});

  // -- test add
  df.pulse(source, changeset().insert(data)).run();
  test.equal(facet.targets().active, 3); // 3 subflows updated
  test.equal(subs.length, 3); // 3 subflows added
  test.equal(subs[0].key, tupleid(data[0]));
  test.equal(subs[1].key, tupleid(data[1]));
  test.equal(subs[2].key, tupleid(data[2]));
  test.deepEqual(values(0), [1, 2]);
  test.deepEqual(values(1), [3, 4]);
  test.deepEqual(values(2), [5, 6]);
  test.ok(tupleid(subs[0].data.value[0]));
  test.ok(tupleid(subs[0].data.value[1]));
  test.ok(tupleid(subs[1].data.value[0]));
  test.ok(tupleid(subs[1].data.value[1]));
  test.ok(tupleid(subs[2].data.value[0]));
  test.ok(tupleid(subs[2].data.value[1]));

  // -- test rem
  df.pulse(source, changeset().remove(data[0])).run();
  test.equal(facet.targets().active, 1); // 1 subflow updated
  test.equal(subs.length, 3); // no new subflows added
  test.deepEqual(values(0), []);
  test.deepEqual(values(1), [3, 4]);
  test.deepEqual(values(2), [5, 6]);

  // -- test add - repopulate subflow
  df.pulse(source, changeset().insert(data[0])).run();
  test.equal(facet.targets().active, 1); // 1 subflow updated
  test.equal(subs.length, 3); // no new subflows added
  test.deepEqual(values(0), [1, 2]);
  test.deepEqual(values(1), [3, 4]);
  test.deepEqual(values(2), [5, 6]);

  // -- test add - new subflow
  df.pulse(source, changeset()
    .insert({"key": "d", "tuples": [{x:7},{x:8}]}))
    .run();
  test.equal(facet.targets().active, 1); // 1 subflow updated
  test.equal(subs.length, 4); // 1 subflow added
  test.deepEqual(values(0), [1, 2]);
  test.deepEqual(values(1), [3, 4]);
  test.deepEqual(values(2), [5, 6]);
  test.deepEqual(values(3), [7, 8]);
  test.ok(tupleid(subs[3].data.value[0]));
  test.ok(tupleid(subs[3].data.value[1]));

  test.end();
});

tape('PreFacet raises error if tuple sets are modified', function(test) {
  var data = [
    {"id": "a", "tuples": [{x:1},{x:2}]},
    {"id": "b", "tuples": [{x:3},{x:4}]},
    {"id": "c", "tuples": [{x:5},{x:6}]}
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
  test.throws(function() {
    df.pulse(source, changeset().modify(data[0], 'tuples', [])).run();
  });

  test.end();
});

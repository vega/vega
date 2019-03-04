var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, tupleid = vega.tupleid, Collect = tx.collect, PreFacet = tx.prefacet;

test('PreFacet partitions pre-faceted tuple sets', function() {
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
  expect(facet.targets().active).toBe(3); // 3 subflows updated
  expect(subs.length).toBe(3); // 3 subflows added
  expect(subs[0].key).toBe(tupleid(data[0]));
  expect(subs[1].key).toBe(tupleid(data[1]));
  expect(subs[2].key).toBe(tupleid(data[2]));
  expect(values(0)).toEqual([1, 2]);
  expect(values(1)).toEqual([3, 4]);
  expect(values(2)).toEqual([5, 6]);
  expect(tupleid(subs[0].data.value[0])).toBeTruthy();
  expect(tupleid(subs[0].data.value[1])).toBeTruthy();
  expect(tupleid(subs[1].data.value[0])).toBeTruthy();
  expect(tupleid(subs[1].data.value[1])).toBeTruthy();
  expect(tupleid(subs[2].data.value[0])).toBeTruthy();
  expect(tupleid(subs[2].data.value[1])).toBeTruthy();

  // -- test rem
  df.pulse(source, changeset().remove(data[0])).run();
  expect(facet.targets().active).toBe(1); // 1 subflow updated
  expect(subs.length).toBe(3); // no new subflows added
  expect(values(0)).toEqual([]);
  expect(values(1)).toEqual([3, 4]);
  expect(values(2)).toEqual([5, 6]);

  // -- test add - repopulate subflow
  df.pulse(source, changeset().insert(data[0])).run();
  expect(facet.targets().active).toBe(1); // 1 subflow updated
  expect(subs.length).toBe(3); // no new subflows added
  expect(values(0)).toEqual([1, 2]);
  expect(values(1)).toEqual([3, 4]);
  expect(values(2)).toEqual([5, 6]);

  // -- test add - new subflow
  df.pulse(source, changeset()
    .insert({"key": "d", "tuples": [{x:7},{x:8}]}))
    .run();
  expect(facet.targets().active).toBe(1); // 1 subflow updated
  expect(subs.length).toBe(4); // 1 subflow added
  expect(values(0)).toEqual([1, 2]);
  expect(values(1)).toEqual([3, 4]);
  expect(values(2)).toEqual([5, 6]);
  expect(values(3)).toEqual([7, 8]);
  expect(tupleid(subs[3].data.value[0])).toBeTruthy();
  expect(tupleid(subs[3].data.value[1])).toBeTruthy();
});

test('PreFacet raises error if tuple sets are modified', function(done) {
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
  df.pulse(source, changeset().modify(data[0], 'tuples', []))
    .runAsync()
    .then(() => expect(false).toBeTruthy())
    .catch(() => expect(true).toBeTruthy())
    .then(() => done());
});

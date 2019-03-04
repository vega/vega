var vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, tupleid = vega.tupleid, Collect = tx.collect, Sample = tx.sample;

test('Sample samples tuples without backing source', function() {
  var n = 100,
      ns = 20,
      data = Array(n),
      map = {},
      i, tid;

  for (i=0; i<n; ++i) data[i] = {v:Math.random()};

  var df = new vega.Dataflow(),
      s = df.add(Sample, {size:ns});

  // -- initial sample
  df.pulse(s, changeset().insert(data)).run();
  expect(s.value.length).toBe(ns);
  expect(s.value.length).not.toEqual(data.slice(0, ns));

  // -- modify tuple in and out sample, check propagation
  s.value.forEach(function(t) { map[tupleid(t)] = 1; });
  var inTuple = s.value[0];
  var outTuple = null;

  for (i=0; i<n; ++i) {
    tid = data[i];
    if (!map[tupleid(tid)]) { outTuple = tid; break; }
  }

  df.pulse(s, changeset()
    .modify(inTuple, 'v', -1)
    .modify(outTuple, 'v', -1)).run();
  expect(s.value.length).toBe(ns);
  expect(s.pulse.mod).toEqual([inTuple]);

  // -- remove half of sample, no backing source
  map = {};
  var rems = s.value.slice(0, 10);
  rems.forEach(function(t) { map[tupleid(t)] = 1; });
  df.pulse(s, changeset().remove(rems)).run();
  expect(s.value.length).toBe(ns - 10);
  expect(s.value.some(function(t) { return map[tupleid(t)]; })).toBe(false);
});

test('Sample samples tuples with backing source', function() {
  var n = 100,
    ns = 20,
    data = Array(n),
    map = {},
    i, tid;

  for (i=0; i<n; ++i) data[i] = {v:Math.random()};

  var df = new vega.Dataflow(),
      c = df.add(Collect),
      s = df.add(Sample, {size:ns, pulse:c});

  // -- initial sample
  df.pulse(c, changeset().insert(data)).run();
  expect(s.value.length).toBe(ns);
  expect(s.value.length).not.toEqual(data.slice(0, ns));

  // -- modify tuple in and out sample, check propagation
  s.value.forEach(function(t) { map[tupleid(t)] = 1; });
  var inTuple = s.value[0];
  var outTuple = null;

  for (i=0; i<n; ++i) {
    tid = data[i];
    if (!map[tupleid(tid)]) { outTuple = tid; break; }
  }

  df.pulse(c, changeset()
    .modify(inTuple, 'v', -1)
    .modify(outTuple, 'v', -1)).run();
  expect(s.value.length).toBe(ns);
  expect(s.pulse.mod).toEqual([inTuple]);

  // -- remove half of sample, with backing source
  df.pulse(c, changeset().remove(s.value.slice())).run();
  expect(s.value.length).toBe(ns);
});

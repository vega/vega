var tape = require('tape'),
    vega = require('../../'),
    changeset = vega.changeset,
    tupleid = vega.tupleid,
    Collect = vega.transforms.Collect,
    Sample = vega.transforms.Sample;

tape('Sample samples tuples without backing source', function(test) {
  var n = 100,
      ns = 20,
      data = Array(n),
      map = {},
      i, t;

  for (i=0; i<n; ++i) data[i] = {v:Math.random()};

  var df = new vega.Dataflow(),
      s = df.add(Sample, {size:ns});

  // -- initial sample
  df.pulse(s, changeset().insert(data)).run();
  test.equal(s.value.length, ns);
  test.notDeepEqual(s.value.length, data.slice(0, ns));

  // -- modify tuple in and out sample, check propagation
  s.value.forEach(function(t) { map[tupleid(t)] = 1; });
  var inTuple = s.value[0];
  var outTuple = null;

  for (i=0; i<n; ++i) {
    t = data[i];
    if (!map[tupleid(t)]) { outTuple = t; break; }
  }

  df.pulse(s, changeset()
    .modify(inTuple, 'v', -1)
    .modify(outTuple, 'v', -1)).run();
  test.equal(s.value.length, ns);
  test.deepEqual(s.pulse.mod, [inTuple]);

  // -- remove half of sample, no backing source
  map = {};
  var rems = s.value.slice(0, 10);
  rems.forEach(function(t) { map[tupleid(t)] = 1; });
  df.pulse(s, changeset().remove(rems)).run();
  test.equal(s.value.length, ns - 10);
  test.equal(s.value.some(function(t) { return map[tupleid(t)]; }), false);

  test.end();
});

tape('Sample samples tuples with backing source', function(test) {
  var n = 100,
    ns = 20,
    data = Array(n),
    map = {},
    i, t;

  for (i=0; i<n; ++i) data[i] = {v:Math.random()};

  var df = new vega.Dataflow(),
      c = df.add(Collect),
      s = df.add(Sample, {size:ns, pulse:c});

  // -- initial sample
  df.pulse(c, changeset().insert(data)).run();
  test.equal(s.value.length, ns);
  test.notDeepEqual(s.value.length, data.slice(0, ns));

  // -- modify tuple in and out sample, check propagation
  s.value.forEach(function(t) { map[tupleid(t)] = 1; });
  var inTuple = s.value[0];
  var outTuple = null;

  for (i=0; i<n; ++i) {
    t = data[i];
    if (!map[tupleid(t)]) { outTuple = t; break; }
  }

  df.pulse(c, changeset()
    .modify(inTuple, 'v', -1)
    .modify(outTuple, 'v', -1)).run();
  test.equal(s.value.length, ns);
  test.deepEqual(s.pulse.mod, [inTuple]);

  // -- remove half of sample, with backing source
  df.pulse(c, changeset().remove(s.value.slice())).run();
  test.equal(s.value.length, ns);

  test.end();
});
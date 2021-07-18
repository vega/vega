var tape = require('tape');
var vega = require('vega-dataflow');
var tx = require('../');
var changeset = vega.changeset;
var tupleid = vega.tupleid;
var Collect = tx.collect;
var Sample = tx.sample;

tape('Sample samples tuples without backing source', t => {
  var n = 100;
  var ns = 20;
  var data = Array(n);
  var map = {};
  var i;
  var tid;

  for (i=0; i<n; ++i) data[i] = {v:Math.random()};

  var df = new vega.Dataflow();
  var s = df.add(Sample, {size:ns});

  // -- initial sample
  df.pulse(s, changeset().insert(data)).run();
  t.equal(s.value.length, ns);
  t.notDeepEqual(s.value.length, data.slice(0, ns));

  // -- modify tuple in and out sample, check propagation
  s.value.forEach(t => { map[tupleid(t)] = 1; });
  const inTuple = s.value[0];
  let outTuple = null;

  for (i=0; i<n; ++i) {
    tid = data[i];
    if (!map[tupleid(tid)]) { outTuple = tid; break; }
  }

  df.pulse(s, changeset()
    .modify(inTuple, 'v', -1)
    .modify(outTuple, 'v', -1)).run();
  t.equal(s.value.length, ns);
  t.deepEqual(s.pulse.mod, [inTuple]);

  // -- remove half of sample, no backing source
  map = {};
  const rems = s.value.slice(0, 10);
  rems.forEach(t => { map[tupleid(t)] = 1; });
  df.pulse(s, changeset().remove(rems)).run();
  t.equal(s.value.length, ns - 10);
  t.equal(s.value.some(t => map[tupleid(t)]), false);

  t.end();
});

tape('Sample samples tuples with backing source', t => {
  var n = 100;
  var ns = 20;
  var data = Array(n);
  var map = {};
  var i;
  var tid;

  for (i=0; i<n; ++i) data[i] = {v:Math.random()};

  var df = new vega.Dataflow();
  var c = df.add(Collect);
  var s = df.add(Sample, {size:ns, pulse:c});

  // -- initial sample
  df.pulse(c, changeset().insert(data)).run();
  t.equal(s.value.length, ns);
  t.notDeepEqual(s.value.length, data.slice(0, ns));

  // -- modify tuple in and out sample, check propagation
  s.value.forEach(t => { map[tupleid(t)] = 1; });
  const inTuple = s.value[0];
  let outTuple = null;

  for (i=0; i<n; ++i) {
    tid = data[i];
    if (!map[tupleid(tid)]) { outTuple = tid; break; }
  }

  df.pulse(c, changeset()
    .modify(inTuple, 'v', -1)
    .modify(outTuple, 'v', -1)).run();
  t.equal(s.value.length, ns);
  t.deepEqual(s.pulse.mod, [inTuple]);

  // -- remove half of sample, with backing source
  df.pulse(c, changeset().remove(s.value.slice())).run();
  t.equal(s.value.length, ns);

  t.end();
});

var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Relay = tx.relay;

tape('Relay propagates pulse', t => {
  const data = [{'id': 0}, {'id': 1}];

  var df = new vega.Dataflow(),
      c = df.add(Collect),
      n = df.add(Relay, {derive: false, pulse:c}),
      p;

  df.pulse(c, changeset().insert(data)).run();
  p = n.pulse;
  t.equal(p, c.pulse);
  t.equal(p.source, c.value);
  t.equal(p.add.length, 2);
  t.equal(p.rem.length, 0);
  t.equal(p.mod.length, 0);

  t.end();
});

tape('Relay relays derived tuples', t => {
  const data = [{'id': 0}, {'id': 1}];

  var id = util.field('id'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      r = df.add(Relay, {derive: true, pulse:c}),
      p;

  // test initial insert
  df.pulse(c, changeset().insert(data)).run();
  p = r.pulse;
  t.equal(p.add.length, 2);
  t.equal(p.rem.length, 0);
  t.equal(p.mod.length, 0);
  t.notEqual(p.add[0], data[0]);
  t.notEqual(p.add[1], data[1]);
  t.deepEqual(p.add.map(id), [0, 1]);

  // test simultaneous remove and add
  // fake changeset to test invalid configuration
  df.pulse(c, {
    pulse: function(p) {
      p.add.push(data[0]);
      p.rem.push(data[0]);
      return p;
    }
  }).run();
  p = r.pulse;
  t.equal(p.add.length, 1);
  t.equal(p.rem.length, 1);
  t.equal(p.mod.length, 0);
  t.notEqual(p.add[0], data[0]);
  t.notEqual(p.rem[0], data[0]);
  t.equal(id(p.add[0]), 0);
  t.equal(id(p.rem[0]), 0);

  // test tuple modification
  df.pulse(c, changeset()
    .modify(() => 1, 'id', t => t.id + 2))
    .run();
  p = r.pulse;
  t.equal(p.add.length, 0);
  t.equal(p.rem.length, 0);
  t.equal(p.mod.length, 2);
  t.notEqual(p.mod[0], data[0]);
  t.notEqual(p.mod[1], data[1]);
  t.deepEqual(p.mod.map(id), [2, 3]);

  // test tuple removal
  df.pulse(c, changeset().remove(data)).run();
  p = r.pulse;
  t.equal(p.add.length, 0);
  t.equal(p.rem.length, 2);
  t.equal(p.mod.length, 0);
  p.rem.sort((a, b) => a.id - b.id);
  t.notEqual(p.rem[0], data[0]);
  t.notEqual(p.rem[1], data[1]);
  t.deepEqual(p.rem.map(id), [2, 3]);

  t.end();
});

tape('Relay flags modified fields and handles multi-pulse', t => {
  var data1 = [{id: 0, foo: 1}, {id: 1, foo: 2}],
      data2 = [{id: 4, bar: 3}, {id: 5, bar: 4}];

  var id = util.field('id'),
      df = new vega.Dataflow(),
      c1 = df.add(Collect),
      c2 = df.add(Collect),
      r = df.add(Relay, {derive: true, pulse:[c1, c2]}),
      p;

  // test initial insert
  df.pulse(c1, changeset().insert(data1))
    .pulse(c2, changeset().insert(data2))
    .run();
  p = r.pulse;
  t.equal(p.add.length, 4);
  t.equal(p.rem.length, 0);
  t.equal(p.mod.length, 0);
  t.notEqual(p.add[0], data1[0]);
  t.notEqual(p.add[1], data1[1]);
  t.deepEqual(p.add.map(id), [0, 1, 4, 5]);

  // test tuple modification
  df.pulse(c1, changeset()
    .modify(util.truthy, 'id', t => t.id + 2))
    .run();
  p = r.pulse;
  t.ok(p.modified('id'));
  t.ok(p.modified('foo'));
  t.notOk(p.modified('bar'));
  t.equal(p.add.length, 0);
  t.equal(p.rem.length, 0);
  t.equal(p.mod.length, 2);
  t.notEqual(p.mod[0], data1[0]);
  t.notEqual(p.mod[1], data1[1]);
  t.deepEqual(p.mod.map(id), [2, 3]);

  t.end();
});

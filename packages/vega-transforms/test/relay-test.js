var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Relay = tx.relay;

tape('Relay propagates pulse', function(test) {
  var data = [{'id': 0}, {'id': 1}];

  var df = new vega.Dataflow(),
      c = df.add(Collect),
      n = df.add(Relay, {derive: false, pulse:c}),
      p;

  df.pulse(c, changeset().insert(data)).run();
  p = n.pulse;
  test.equal(p, c.pulse);
  test.equal(p.source, c.value);
  test.equal(p.add.length, 2);
  test.equal(p.rem.length, 0);
  test.equal(p.mod.length, 0);

  test.end();
});

tape('Relay relays derived tuples', function(test) {
  var data = [{'id': 0}, {'id': 1}];

  var id = util.field('id'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      r = df.add(Relay, {derive: true, pulse:c}),
      p;

  // test initial insert
  df.pulse(c, changeset().insert(data)).run();
  p = r.pulse;
  test.equal(p.add.length, 2);
  test.equal(p.rem.length, 0);
  test.equal(p.mod.length, 0);
  test.notEqual(p.add[0], data[0]);
  test.notEqual(p.add[1], data[1]);
  test.deepEqual(p.add.map(id), [0, 1]);

  // test simultaneous remove and add
  df.pulse(c, changeset().remove(data[0]).insert(data[0])).run();
  p = r.pulse;
  test.equal(p.add.length, 1);
  test.equal(p.rem.length, 1);
  test.equal(p.mod.length, 0);
  test.notEqual(p.add[0], data[0]);
  test.notEqual(p.rem[0], data[0]);
  test.equal(id(p.add[0]), 0);
  test.equal(id(p.rem[0]), 0);

  // test tuple modification
  df.pulse(c, changeset()
    .modify(function() { return 1; }, 'id', function(t) { return t.id + 2; }))
    .run();
  p = r.pulse;
  test.equal(p.add.length, 0);
  test.equal(p.rem.length, 0);
  test.equal(p.mod.length, 2);
  test.notEqual(p.mod[0], data[0]);
  test.notEqual(p.mod[1], data[1]);
  test.deepEqual(p.mod.map(id), [2, 3]);

  // test tuple removal
  df.pulse(c, changeset().remove(data)).run();
  p = r.pulse;
  test.equal(p.add.length, 0);
  test.equal(p.rem.length, 2);
  test.equal(p.mod.length, 0);
  test.notEqual(p.rem[0], data[0]);
  test.notEqual(p.rem[1], data[1]);
  test.deepEqual(p.rem.map(id), [2, 3]);

  test.end();
});

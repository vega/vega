var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, Relay = tx.relay;

test('Relay propagates pulse', function() {
  var data = [{'id': 0}, {'id': 1}];

  var df = new vega.Dataflow(),
      c = df.add(Collect),
      n = df.add(Relay, {derive: false, pulse:c}),
      p;

  df.pulse(c, changeset().insert(data)).run();
  p = n.pulse;
  expect(p).toBe(c.pulse);
  expect(p.source).toBe(c.value);
  expect(p.add.length).toBe(2);
  expect(p.rem.length).toBe(0);
  expect(p.mod.length).toBe(0);
});

test('Relay relays derived tuples', function() {
  var data = [{'id': 0}, {'id': 1}];

  var id = util.field('id'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      r = df.add(Relay, {derive: true, pulse:c}),
      p;

  // test initial insert
  df.pulse(c, changeset().insert(data)).run();
  p = r.pulse;
  expect(p.add.length).toBe(2);
  expect(p.rem.length).toBe(0);
  expect(p.mod.length).toBe(0);
  expect(p.add[0]).not.toBe(data[0]);
  expect(p.add[1]).not.toBe(data[1]);
  expect(p.add.map(id)).toEqual([0, 1]);

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
  expect(p.add.length).toBe(1);
  expect(p.rem.length).toBe(1);
  expect(p.mod.length).toBe(0);
  expect(p.add[0]).not.toBe(data[0]);
  expect(p.rem[0]).not.toBe(data[0]);
  expect(id(p.add[0])).toBe(0);
  expect(id(p.rem[0])).toBe(0);

  // test tuple modification
  df.pulse(c, changeset()
    .modify(function() { return 1; }, 'id', function(t) { return t.id + 2; }))
    .run();
  p = r.pulse;
  expect(p.add.length).toBe(0);
  expect(p.rem.length).toBe(0);
  expect(p.mod.length).toBe(2);
  expect(p.mod[0]).not.toBe(data[0]);
  expect(p.mod[1]).not.toBe(data[1]);
  expect(p.mod.map(id)).toEqual([2, 3]);

  // test tuple removal
  df.pulse(c, changeset().remove(data)).run();
  p = r.pulse;
  expect(p.add.length).toBe(0);
  expect(p.rem.length).toBe(2);
  expect(p.mod.length).toBe(0);
  p.rem.sort(function(a, b) { return a.id - b.id; });
  expect(p.rem[0]).not.toBe(data[0]);
  expect(p.rem[1]).not.toBe(data[1]);
  expect(p.rem.map(id)).toEqual([2, 3]);
});

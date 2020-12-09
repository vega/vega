var tape = require('tape'),
    vega = require('../');

tape('ChangeSet adds/removes/modifies tuples', t => {
  const data = [
    {key: 'a', value: 1},
    {key: 'b', value: 2},
    {key: 'c', value: 3}
  ];

  var extra = {key: 'd', value: 6},
      pulse;

  // add tuples
  // should also assign tuple ids to each object
  pulse = vega.changeset()
    .insert(data)
    .pulse(new vega.Pulse(), []);
  t.deepEqual(pulse.add, data);
  t.deepEqual(pulse.rem, []);
  t.deepEqual(pulse.mod, []);
  t.ok(data.every(vega.tupleid));

  // modify tuple directly
  pulse = vega.changeset()
    .modify(data[0], 'value', 5)
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, []);
  t.deepEqual(pulse.mod, [data[0]]);
  t.equal(data[0].value, 5);

  // modify tuples by predicate
  pulse = vega.changeset()
    .modify(
      t => t.key === 'b',
      'value',
      t => t.value + 2
    )
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, []);
  t.deepEqual(pulse.mod, [data[1]]);
  t.equal(data[1].value, 4);

  // remove tuple directly
  pulse = vega.changeset()
    .remove(data[0])
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, [data[0]]);
  t.deepEqual(pulse.mod, []);

  // remove tuples by predicate
  pulse = vega.changeset()
    .remove(t => t.value < 5)
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, data.slice(1));
  t.deepEqual(pulse.mod, []);

  // perform all three operations at once
  // here, no tuples are implicated in more than one set
  pulse = vega.changeset()
    .insert(extra)
    .remove(t => t.value === 3)
    .modify(data[1], 'key', 'e')
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, [extra]);
  t.ok(vega.tupleid(extra));
  t.deepEqual(pulse.rem, [data[2]]);
  t.deepEqual(pulse.mod, [data[1]]);
  t.equal(data[1].key, 'e');

  t.end();
});

tape('ChangeSet handles conflicting changes', t => {
  const data = [
    {key: 'a', value: 1},
    {key: 'b', value: 2},
    {key: 'c', value: 3}
  ];

  var extra = {key: 'd', value: 6},
      pulse;

  // perform initial add, ingest tuples
  pulse = vega.changeset()
    .insert(data)
    .pulse(new vega.Pulse(), []);
  t.deepEqual(pulse.add, data);
  t.deepEqual(pulse.rem, []);
  t.deepEqual(pulse.mod, []);
  t.ok(data.every(vega.tupleid));

  // add + mod
  // behavior: add if not already added, modify only if already present
  pulse = vega.changeset()
    .insert(data)
    .modify(data[1], 'key', 'e')
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, []);
  t.deepEqual(pulse.mod, [data[1]]);
  t.equal(data[1].key, 'e');

  pulse = vega.changeset()
    .insert(extra)
    .modify(extra, 'key', 'f')
    .pulse(new vega.Pulse(), []);
  t.deepEqual(pulse.add, [extra]);
  t.deepEqual(pulse.rem, []);
  t.deepEqual(pulse.mod, []);
  t.equal(extra.key, 'd'); // unchanged

  // rem + mod
  // tuple should be removed, unmodified
  pulse = vega.changeset()
    .remove(data[0])
    .modify(data[0], 'key', 'f')
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, [data[0]]);
  t.deepEqual(pulse.mod, []);
  t.equal(data[0].key, 'a'); // unchanged

  pulse = vega.changeset()
    .remove(t => t.value < 3)
    .modify(
      t => t.key === 'a',
      'value',
      t => t.value + 2
    )
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, data.slice(0, 2));
  t.deepEqual(pulse.mod, []);
  t.equal(data[0].value, 1); // unchanged

  // add + rem
  // add + rem + mod
  // operations should cancel
  pulse = vega.changeset()
    .insert(data)
    .remove(data)
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, []);
  t.deepEqual(pulse.mod, []);

  pulse = vega.changeset()
    .insert(data[0])
    .remove(() => true)
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, data.slice(1));
  t.deepEqual(pulse.mod, []);

  pulse = vega.changeset()
    .insert(data[2])
    .remove(() => true)
    .modify(
      t => t.value > 1,
      'value',
      t => t.value + 2
    )
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, data.slice(0, 2));
  t.deepEqual(pulse.mod, [data[2]]);
  t.equal(data[2].value, 5); // modified

  t.end();
});

tape('ChangeSet handles reflow', t => {
  const data = [
    {key: 'a', value: 1},
    {key: 'b', value: 2},
    {key: 'c', value: 3}
  ];

  var extra = {key: 'd', value: 6},
      pulse;

  // initial add
  pulse = vega.changeset()
    .insert(data)
    .pulse(new vega.Pulse(), []);
  t.deepEqual(pulse.add, data);
  t.deepEqual(pulse.rem, []);
  t.deepEqual(pulse.mod, []);
  t.ok(data.every(vega.tupleid));

  // add, modify and reflow tuples
  pulse = vega.changeset()
    .insert(extra)
    .modify(data[0], 'key', 'd')
    .reflow()
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, [extra]);
  t.deepEqual(pulse.rem, []);
  t.deepEqual(pulse.mod, data);
  t.equal(data[0].key, 'd');

  // remove, modify and reflow tuples
  pulse = vega.changeset()
    .remove(t => t.value < 2)
    .modify(data[2], 'key', 'f')
    .reflow()
    .pulse(new vega.Pulse(), data);
  t.deepEqual(pulse.add, []);
  t.deepEqual(pulse.rem, data.slice(0, 1));
  t.deepEqual(pulse.mod, data.slice(1));
  t.equal(data[2].key, 'f');

  t.end();
});

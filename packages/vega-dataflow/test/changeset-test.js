var tape = require('tape'),
    vega = require('../');

tape('ChangeSet adds/removes/modifies tuples', function(test) {
  var data = [
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
  test.deepEqual(pulse.add, data);
  test.deepEqual(pulse.rem, []);
  test.deepEqual(pulse.mod, []);
  test.ok(data.every(vega.tupleid));

  // modify tuple directly
  pulse = vega.changeset()
    .modify(data[0], 'value', 5)
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, []);
  test.deepEqual(pulse.mod, [data[0]]);
  test.equal(data[0].value, 5);

  // modify tuples by predicate
  pulse = vega.changeset()
    .modify(
      function(t) { return t.key === 'b'; },
      'value',
      function(t) { return t.value + 2; }
    )
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, []);
  test.deepEqual(pulse.mod, [data[1]]);
  test.equal(data[1].value, 4);

  // remove tuple directly
  pulse = vega.changeset()
    .remove(data[0])
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, [data[0]]);
  test.deepEqual(pulse.mod, []);

  // remove tuples by predicate
  pulse = vega.changeset()
    .remove(function(t) { return t.value < 5; })
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, data.slice(1));
  test.deepEqual(pulse.mod, []);

  // perform all three operations at once
  // here, no tuples are implicated in more than one set
  pulse = vega.changeset()
    .insert(extra)
    .remove(function(t) { return t.value === 3; })
    .modify(data[1], 'key', 'e')
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, [extra]);
  test.ok(vega.tupleid(extra));
  test.deepEqual(pulse.rem, [data[2]]);
  test.deepEqual(pulse.mod, [data[1]]);
  test.equal(data[1].key, 'e');

  test.end();
});

tape('ChangeSet handles conflicting changes', function(test) {
  var data = [
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
  test.deepEqual(pulse.add, data);
  test.deepEqual(pulse.rem, []);
  test.deepEqual(pulse.mod, []);
  test.ok(data.every(vega.tupleid));

  // add + mod
  // behavior: add if not already added, modify only if already present
  pulse = vega.changeset()
    .insert(data)
    .modify(data[1], 'key', 'e')
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, []);
  test.deepEqual(pulse.mod, [data[1]]);
  test.equal(data[1].key, 'e');

  pulse = vega.changeset()
    .insert(extra)
    .modify(extra, 'key', 'f')
    .pulse(new vega.Pulse(), []);
  test.deepEqual(pulse.add, [extra]);
  test.deepEqual(pulse.rem, []);
  test.deepEqual(pulse.mod, []);
  test.equal(extra.key, 'd'); // unchanged

  // rem + mod
  // tuple should be removed, unmodified
  pulse = vega.changeset()
    .remove(data[0])
    .modify(data[0], 'key', 'f')
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, [data[0]]);
  test.deepEqual(pulse.mod, []);
  test.equal(data[0].key, 'a'); // unchanged

  pulse = vega.changeset()
    .remove(function(t) { return t.value < 3; })
    .modify(
      function(t) { return t.key === 'a'; },
      'value',
      function(t) { return t.value + 2; }
    )
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, data.slice(0, 2));
  test.deepEqual(pulse.mod, []);
  test.equal(data[0].value, 1); // unchanged

  // add + rem
  // add + rem + mod
  // operations should cancel
  pulse = vega.changeset()
    .insert(data)
    .remove(data)
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, []);
  test.deepEqual(pulse.mod, []);

  pulse = vega.changeset()
    .insert(data[0])
    .remove(function() { return true; })
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, data.slice(1));
  test.deepEqual(pulse.mod, []);

  pulse = vega.changeset()
    .insert(data[2])
    .remove(function() { return true; })
    .modify(
      function(t) { return t.value > 1; },
      'value',
      function(t) { return t.value + 2; }
    )
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, data.slice(0, 2));
  test.deepEqual(pulse.mod, [data[2]]);
  test.equal(data[2].value, 5); // modified

  test.end();
});

tape('ChangeSet handles reflow', function(test) {
  var data = [
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
  test.deepEqual(pulse.add, data);
  test.deepEqual(pulse.rem, []);
  test.deepEqual(pulse.mod, []);
  test.ok(data.every(vega.tupleid));

  // add, modify and reflow tuples
  pulse = vega.changeset()
    .insert(extra)
    .modify(data[0], 'key', 'd')
    .reflow()
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, [extra]);
  test.deepEqual(pulse.rem, []);
  test.deepEqual(pulse.mod, data);
  test.equal(data[0].key, 'd');

  // remove, modify and reflow tuples
  pulse = vega.changeset()
    .remove(function(t) { return t.value < 2; })
    .modify(data[2], 'key', 'f')
    .reflow()
    .pulse(new vega.Pulse(), data);
  test.deepEqual(pulse.add, []);
  test.deepEqual(pulse.rem, data.slice(0, 1));
  test.deepEqual(pulse.mod, data.slice(1));
  test.equal(data[2].key, 'f');

  test.end();
});

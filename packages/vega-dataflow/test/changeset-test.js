var vega = require('../');

test('ChangeSet adds/removes/modifies tuples', function() {
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
  expect(pulse.add).toEqual(data);
  expect(pulse.rem).toEqual([]);
  expect(pulse.mod).toEqual([]);
  expect(data.every(vega.tupleid)).toBeTruthy();

  // modify tuple directly
  pulse = vega.changeset()
    .modify(data[0], 'value', 5)
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual([]);
  expect(pulse.mod).toEqual([data[0]]);
  expect(data[0].value).toBe(5);

  // modify tuples by predicate
  pulse = vega.changeset()
    .modify(
      function(t) { return t.key === 'b'; },
      'value',
      function(t) { return t.value + 2; }
    )
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual([]);
  expect(pulse.mod).toEqual([data[1]]);
  expect(data[1].value).toBe(4);

  // remove tuple directly
  pulse = vega.changeset()
    .remove(data[0])
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual([data[0]]);
  expect(pulse.mod).toEqual([]);

  // remove tuples by predicate
  pulse = vega.changeset()
    .remove(function(t) { return t.value < 5; })
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual(data.slice(1));
  expect(pulse.mod).toEqual([]);

  // perform all three operations at once
  // here, no tuples are implicated in more than one set
  pulse = vega.changeset()
    .insert(extra)
    .remove(function(t) { return t.value === 3; })
    .modify(data[1], 'key', 'e')
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([extra]);
  expect(vega.tupleid(extra)).toBeTruthy();
  expect(pulse.rem).toEqual([data[2]]);
  expect(pulse.mod).toEqual([data[1]]);
  expect(data[1].key).toBe('e');
});

test('ChangeSet handles conflicting changes', function() {
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
  expect(pulse.add).toEqual(data);
  expect(pulse.rem).toEqual([]);
  expect(pulse.mod).toEqual([]);
  expect(data.every(vega.tupleid)).toBeTruthy();

  // add + mod
  // behavior: add if not already added, modify only if already present
  pulse = vega.changeset()
    .insert(data)
    .modify(data[1], 'key', 'e')
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual([]);
  expect(pulse.mod).toEqual([data[1]]);
  expect(data[1].key).toBe('e');

  pulse = vega.changeset()
    .insert(extra)
    .modify(extra, 'key', 'f')
    .pulse(new vega.Pulse(), []);
  expect(pulse.add).toEqual([extra]);
  expect(pulse.rem).toEqual([]);
  expect(pulse.mod).toEqual([]);
  expect(extra.key).toBe('d'); // unchanged

  // rem + mod
  // tuple should be removed, unmodified
  pulse = vega.changeset()
    .remove(data[0])
    .modify(data[0], 'key', 'f')
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual([data[0]]);
  expect(pulse.mod).toEqual([]);
  expect(data[0].key).toBe('a'); // unchanged

  pulse = vega.changeset()
    .remove(function(t) { return t.value < 3; })
    .modify(
      function(t) { return t.key === 'a'; },
      'value',
      function(t) { return t.value + 2; }
    )
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual(data.slice(0, 2));
  expect(pulse.mod).toEqual([]);
  expect(data[0].value).toBe(1); // unchanged

  // add + rem
  // add + rem + mod
  // operations should cancel
  pulse = vega.changeset()
    .insert(data)
    .remove(data)
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual([]);
  expect(pulse.mod).toEqual([]);

  pulse = vega.changeset()
    .insert(data[0])
    .remove(function() { return true; })
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual(data.slice(1));
  expect(pulse.mod).toEqual([]);

  pulse = vega.changeset()
    .insert(data[2])
    .remove(function() { return true; })
    .modify(
      function(t) { return t.value > 1; },
      'value',
      function(t) { return t.value + 2; }
    )
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual(data.slice(0, 2));
  expect(pulse.mod).toEqual([data[2]]);
  expect(data[2].value).toBe(5); // modified
});

test('ChangeSet handles reflow', function() {
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
  expect(pulse.add).toEqual(data);
  expect(pulse.rem).toEqual([]);
  expect(pulse.mod).toEqual([]);
  expect(data.every(vega.tupleid)).toBeTruthy();

  // add, modify and reflow tuples
  pulse = vega.changeset()
    .insert(extra)
    .modify(data[0], 'key', 'd')
    .reflow()
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([extra]);
  expect(pulse.rem).toEqual([]);
  expect(pulse.mod).toEqual(data);
  expect(data[0].key).toBe('d');

  // remove, modify and reflow tuples
  pulse = vega.changeset()
    .remove(function(t) { return t.value < 2; })
    .modify(data[2], 'key', 'f')
    .reflow()
    .pulse(new vega.Pulse(), data);
  expect(pulse.add).toEqual([]);
  expect(pulse.rem).toEqual(data.slice(0, 1));
  expect(pulse.mod).toEqual(data.slice(1));
  expect(data[2].key).toBe('f');
});

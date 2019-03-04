var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, Project = tx.project;

test('Project copies tuples', function() {
  var data = [{'id': 0}, {'id': 1}];

  var id = util.field('id'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      r = df.add(Project, {pulse:c}),
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

test('Project projects tuples', function() {
  var data = [{'id': 0, 'foo': 'a'}, {'id': 1, 'foo': 'b'}];

  var id = util.field('id'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      r = df.add(Project, {
          fields: [id],
          pulse: c
        }),
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

test('Project aliases tuples', function() {
  var data = [{'id': 0, 'foo': 'a'}, {'id': 1, 'foo': 'b'}];

  var id = util.field('id'),
      foo = util.field('foo'),
      key = util.field('key'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      r = df.add(Project, {
          fields: [id, foo],
          as: ['key'],
          pulse: c
        }),
      p;

  // test initial insert
  df.pulse(c, changeset().insert(data)).run();
  p = r.pulse;
  expect(p.add.length).toBe(2);
  expect(p.rem.length).toBe(0);
  expect(p.mod.length).toBe(0);
  expect(p.add[0]).not.toBe(data[0]);
  expect(p.add[1]).not.toBe(data[1]);
  expect(p.add.map(key)).toEqual([0, 1]);
  expect(p.add.map(foo)).toEqual(['a', 'b']);

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
  expect(key(p.add[0])).toBe(0);
  expect(key(p.rem[0])).toBe(0);

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
  expect(p.mod.map(key)).toEqual([2, 3]);
  expect(p.mod.map(foo)).toEqual(['a', 'b']);

  // test tuple removal
  df.pulse(c, changeset().remove(data)).run();
  p = r.pulse;
  expect(p.add.length).toBe(0);
  expect(p.rem.length).toBe(2);
  expect(p.mod.length).toBe(0);
  p.rem.sort(function(a, b) { return a.key - b.key; });
  expect(p.rem[0]).not.toBe(data[0]);
  expect(p.rem[1]).not.toBe(data[1]);
  expect(p.rem.map(key)).toEqual([2, 3]);
  expect(p.rem.map(foo)).toEqual(['a', 'b']);
});

test('Project projects tuples with nested properties', function() {
  var data = [
    {'id': 0, 'obj': {'foo': {'bar': 'a'}}},
    {'id': 1, 'obj': {'foo': {'bar': 'b'}}}
  ];

  var id = util.field('id'),
      foo = util.field('foo'),
      obj = util.field('obj.foo.bar'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      r = df.add(Project, {
          fields: [id, obj],
          as: ['id', 'foo'],
          pulse: c
        }),
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
  expect(p.add.map(foo)).toEqual(['a', 'b']);

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
  expect(p.mod.map(foo)).toEqual(['a', 'b']);

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
  expect(p.rem.map(foo)).toEqual(['a', 'b']);
});

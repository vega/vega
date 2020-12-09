var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Project = tx.project;

tape('Project copies tuples', t => {
  const data = [{'id': 0}, {'id': 1}];

  var id = util.field('id'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      r = df.add(Project, {pulse:c}),
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

tape('Project projects tuples', t => {
  const data = [{'id': 0, 'foo': 'a'}, {'id': 1, 'foo': 'b'}];

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

tape('Project aliases tuples', t => {
  const data = [{'id': 0, 'foo': 'a'}, {'id': 1, 'foo': 'b'}];

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
  t.equal(p.add.length, 2);
  t.equal(p.rem.length, 0);
  t.equal(p.mod.length, 0);
  t.notEqual(p.add[0], data[0]);
  t.notEqual(p.add[1], data[1]);
  t.deepEqual(p.add.map(key), [0, 1]);
  t.deepEqual(p.add.map(foo), ['a', 'b']);

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
  t.equal(key(p.add[0]), 0);
  t.equal(key(p.rem[0]), 0);

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
  t.deepEqual(p.mod.map(key), [2, 3]);
  t.deepEqual(p.mod.map(foo), ['a', 'b']);

  // test tuple removal
  df.pulse(c, changeset().remove(data)).run();
  p = r.pulse;
  t.equal(p.add.length, 0);
  t.equal(p.rem.length, 2);
  t.equal(p.mod.length, 0);
  p.rem.sort((a, b) => a.key - b.key);
  t.notEqual(p.rem[0], data[0]);
  t.notEqual(p.rem[1], data[1]);
  t.deepEqual(p.rem.map(key), [2, 3]);
  t.deepEqual(p.rem.map(foo), ['a', 'b']);

  t.end();
});

tape('Project projects tuples with nested properties', t => {
  const data = [
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
  t.equal(p.add.length, 2);
  t.equal(p.rem.length, 0);
  t.equal(p.mod.length, 0);
  t.notEqual(p.add[0], data[0]);
  t.notEqual(p.add[1], data[1]);
  t.deepEqual(p.add.map(id), [0, 1]);
  t.deepEqual(p.add.map(foo), ['a', 'b']);

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
  t.deepEqual(p.mod.map(foo), ['a', 'b']);

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
  t.deepEqual(p.rem.map(foo), ['a', 'b']);

  t.end();
});

var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Project = tx.project;

tape('Project copies tuples', function(test) {
  var data = [{'id': 0}, {'id': 1}];

  var id = util.field('id'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      r = df.add(Project, {pulse:c}),
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

tape('Project projects tuples', function(test) {
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

tape('Project aliases tuples', function(test) {
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
  test.equal(p.add.length, 2);
  test.equal(p.rem.length, 0);
  test.equal(p.mod.length, 0);
  test.notEqual(p.add[0], data[0]);
  test.notEqual(p.add[1], data[1]);
  test.deepEqual(p.add.map(key), [0, 1]);
  test.deepEqual(p.add.map(foo), ['a', 'b']);

  // test simultaneous remove and add
  df.pulse(c, changeset().remove(data[0]).insert(data[0])).run();
  p = r.pulse;
  test.equal(p.add.length, 1);
  test.equal(p.rem.length, 1);
  test.equal(p.mod.length, 0);
  test.notEqual(p.add[0], data[0]);
  test.notEqual(p.rem[0], data[0]);
  test.equal(key(p.add[0]), 0);
  test.equal(key(p.rem[0]), 0);

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
  test.deepEqual(p.mod.map(key), [2, 3]);
  test.deepEqual(p.mod.map(foo), ['a', 'b']);

  // test tuple removal
  df.pulse(c, changeset().remove(data)).run();
  p = r.pulse;
  test.equal(p.add.length, 0);
  test.equal(p.rem.length, 2);
  test.equal(p.mod.length, 0);
  test.notEqual(p.rem[0], data[0]);
  test.notEqual(p.rem[1], data[1]);
  test.deepEqual(p.rem.map(key), [2, 3]);
  test.deepEqual(p.rem.map(foo), ['a', 'b']);

  test.end();
});

tape('Project projects tuples with nested properties', function(test) {
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
  test.equal(p.add.length, 2);
  test.equal(p.rem.length, 0);
  test.equal(p.mod.length, 0);
  test.notEqual(p.add[0], data[0]);
  test.notEqual(p.add[1], data[1]);
  test.deepEqual(p.add.map(id), [0, 1]);
  test.deepEqual(p.add.map(foo), ['a', 'b']);

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
  test.deepEqual(p.mod.map(foo), ['a', 'b']);

  // test tuple removal
  df.pulse(c, changeset().remove(data)).run();
  p = r.pulse;
  test.equal(p.add.length, 0);
  test.equal(p.rem.length, 2);
  test.equal(p.mod.length, 0);
  test.notEqual(p.rem[0], data[0]);
  test.notEqual(p.rem[1], data[1]);
  test.deepEqual(p.rem.map(id), [2, 3]);
  test.deepEqual(p.rem.map(foo), ['a', 'b']);

  test.end();
});
var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, Lookup = tx.lookup, TupleIndex = tx.tupleindex;

test('Lookup looks up matching tuples', function() {
  var lut = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var data = [
    {'id': 0, 'x': 5, 'y': 1},
    {'id': 1, 'x': 3, 'y': 5},
    {'id': 2, 'x': 1, 'y': 5},
    {'id': 3, 'x': 3, 'y': 3}
  ];

  var uv = util.field('u.value'),
      vv = util.field('v.value'),
      id = util.field('id'),
      x  = util.field('x'),
      y  = util.field('y'),

      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      ti = df.add(TupleIndex, {field:id, pulse:c0}),
      c1 = df.add(Collect),
      lk = df.add([x,y]),
      lu = df.add(Lookup, {index:ti, fields:lk, as:['u','v'], pulse:c1});

  df.run(); // initialize

  // add lookup table
  df.pulse(c0, changeset().insert(lut)).run();
  expect(ti.value.size).toBe(3);

  // add primary data
  df.pulse(c1, changeset().insert(data)).run();
  var p = lu.pulse.add;
  expect(p.length).toBe(4);
  expect(p.map(uv)).toEqual(['baz', 'bar', 'foo', 'bar']);
  expect(p.map(vv)).toEqual(['foo', 'baz', 'baz', 'bar']);

  // swap lookup keys
  df.update(lk, [y,x]).run();
  p = lu.pulse.mod;
  expect(p.length).toBe(4);
  expect(p.map(vv)).toEqual(['baz', 'bar', 'foo', 'bar']);
  expect(p.map(uv)).toEqual(['foo', 'baz', 'baz', 'bar']);
});

test('Lookup looks up matching values', function() {
  var lut = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var data = [
    {'id': 0, 'x': 5, 'y': 1},
    {'id': 1, 'x': 3, 'y': 5},
    {'id': 2, 'x': 1, 'y': 5},
    {'id': 3, 'x': 3, 'y': 3}
  ];

  var value = util.field('value'),
      id = util.field('id'),
      x = util.field('x'),
      y = util.field('y'),

      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      ti = df.add(TupleIndex, {field:id, pulse:c0}),
      c1 = df.add(Collect),
      lk = df.add([x]),
      lu = df.add(Lookup, {index:ti, fields:lk, values:[value], pulse:c1});

  df.run(); // initialize

  // add lookup table
  df.pulse(c0, changeset().insert(lut)).run();
  expect(ti.value.size).toBe(3);

  // add primary data
  df.pulse(c1, changeset().insert(data)).run();
  var p = lu.pulse.add;
  expect(p.length).toBe(4);
  expect(p.map(value)).toEqual(['baz', 'bar', 'foo', 'bar']);

  // swap lookup keys
  df.update(lk, [y]).run();
  p = lu.pulse.mod;
  expect(p.length).toBe(4);
  expect(p.map(value)).toEqual(['foo', 'baz', 'baz', 'bar']);

  // modify lookup table
  df.pulse(c0, changeset().modify(lut[0], 'value', 'fud')).run();
  p = lu.pulse.mod;
  expect(p.length).toBe(4);
  expect(p.map(value)).toEqual(['fud', 'baz', 'baz', 'bar']);
});

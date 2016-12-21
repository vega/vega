var tape = require('tape'),
    util = require('vega-util'),
    vega = require('../../'),
    changeset = vega.changeset,
    Collect = vega.transforms.Collect,
    Lookup = vega.transforms.Lookup,
    TupleIndex = vega.transforms.TupleIndex;

tape('Lookup looks up matching tuples', function(test) {
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
  test.equal(ti.value.size, 3);

  // add primary data
  df.pulse(c1, changeset().insert(data)).run();
  var p = lu.pulse.add;
  test.equal(p.length, 4);
  test.deepEqual(p.map(uv), ['baz', 'bar', 'foo', 'bar']);
  test.deepEqual(p.map(vv), ['foo', 'baz', 'baz', 'bar']);

  // swap lookup keys
  df.update(lk, [y,x]).run();
  p = lu.pulse.mod;
  test.equal(p.length, 4);
  test.deepEqual(p.map(vv), ['baz', 'bar', 'foo', 'bar']);
  test.deepEqual(p.map(uv), ['foo', 'baz', 'baz', 'bar']);

  test.end();
});

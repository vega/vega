var tape = require('tape');
var util = require('vega-util');
var vega = require('vega-dataflow');
var tx = require('../');
var changeset = vega.changeset;
var Collect = tx.collect;
var Lookup = tx.lookup;
var TupleIndex = tx.tupleindex;

tape('Lookup looks up matching tuples', t => {
  const lut = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  const data = [
    {'id': 0, 'x': 5, 'y': 1},
    {'id': 1, 'x': 3, 'y': 5},
    {'id': 2, 'x': 1, 'y': 5},
    {'id': 3, 'x': 3, 'y': 3}
  ];

  var uv = util.field('u.value');
  var vv = util.field('v.value');
  var id = util.field('id');
  var x  = util.field('x');
  var y  = util.field('y');
  var df = new vega.Dataflow();
  var c0 = df.add(Collect);
  var ti = df.add(TupleIndex, {field:id, pulse:c0});
  var c1 = df.add(Collect);
  var lk = df.add([x,y]);
  var lu = df.add(Lookup, {index:ti, fields:lk, as:['u','v'], pulse:c1});

  df.run(); // initialize

  // add lookup table
  df.pulse(c0, changeset().insert(lut)).run();
  t.equal(ti.value.size, 3);

  // add primary data
  df.pulse(c1, changeset().insert(data)).run();
  let p = lu.pulse.add;
  t.equal(p.length, 4);
  t.deepEqual(p.map(uv), ['baz', 'bar', 'foo', 'bar']);
  t.deepEqual(p.map(vv), ['foo', 'baz', 'baz', 'bar']);

  // swap lookup keys
  df.update(lk, [y,x]).run();
  p = lu.pulse.mod;
  t.equal(p.length, 4);
  t.deepEqual(p.map(vv), ['baz', 'bar', 'foo', 'bar']);
  t.deepEqual(p.map(uv), ['foo', 'baz', 'baz', 'bar']);

  t.end();
});

tape('Lookup looks up matching values', t => {
  const lut = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  const data = [
    {'id': 0, 'x': 5, 'y': 1},
    {'id': 1, 'x': 3, 'y': 5},
    {'id': 2, 'x': 1, 'y': 5},
    {'id': 3, 'x': 3, 'y': 3}
  ];

  var value = util.field('value');
  var id = util.field('id');
  var x = util.field('x');
  var y = util.field('y');
  var df = new vega.Dataflow();
  var c0 = df.add(Collect);
  var ti = df.add(TupleIndex, {field:id, pulse:c0});
  var c1 = df.add(Collect);
  var lk = df.add([x]);
  var lu = df.add(Lookup, {index:ti, fields:lk, values:[value], pulse:c1});

  df.run(); // initialize

  // add lookup table
  df.pulse(c0, changeset().insert(lut)).run();
  t.equal(ti.value.size, 3);

  // add primary data
  df.pulse(c1, changeset().insert(data)).run();
  let p = lu.pulse.add;
  t.equal(p.length, 4);
  t.deepEqual(p.map(value), ['baz', 'bar', 'foo', 'bar']);

  // swap lookup keys
  df.update(lk, [y]).run();
  p = lu.pulse.mod;
  t.equal(p.length, 4);
  t.deepEqual(p.map(value), ['foo', 'baz', 'baz', 'bar']);

  // modify lookup table
  df.pulse(c0, changeset().modify(lut[0], 'value', 'fud')).run();
  p = lu.pulse.mod;
  t.equal(p.length, 4);
  t.deepEqual(p.map(value), ['fud', 'baz', 'baz', 'bar']);

  t.end();
});

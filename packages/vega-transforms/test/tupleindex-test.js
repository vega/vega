var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, TupleIndex = tx.tupleindex;

test('TupleIndex maintains an index of tuples', function() {
  var data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var id = util.field('id'),
      va = util.field('value'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      fi = df.add(null), // populate with field accessor later
      ti = df.add(TupleIndex, {field:fi, pulse:c0}),
      map;

  df.update(fi, id).run(); // initialize

  // add data
  df.pulse(c0, changeset().insert(data)).run();
  map = ti.value;
  expect(map.size).toBe(3);
  expect(map.get(1)).toBe(data[0]);
  expect(map.get(3)).toBe(data[1]);
  expect(map.get(5)).toBe(data[2]);
  expect(map.get(0)).toBe(undefined);
  expect(ti.modified()).toBe(true);

  // change key field value
  df.pulse(c0, changeset().modify(data[0], 'id', 2)).run();
  map = ti.value;
  expect(map.size).toBe(3);
  expect(map.get(2)).toBe(data[0]);
  expect(map.get(3)).toBe(data[1]);
  expect(map.get(5)).toBe(data[2]);
  expect(map.get(1)).toBe(undefined);
  expect(ti.modified()).toBe(true);

  // change non-key field value
  df.pulse(c0, changeset().modify(data[1], 'value', 'boo')).run();
  map = ti.value;
  expect(map.size).toBe(3);
  expect(map.get(2)).toBe(data[0]);
  expect(map.get(3)).toBe(data[1]);
  expect(map.get(5)).toBe(data[2]);
  expect(map.get(1)).toBe(undefined);
  expect(ti.modified()).toBe(true); // should signal changes to data

  // do nothing
  df.touch(c0).touch(ti).run();
  map = ti.value;
  expect(map.size).toBe(3);
  expect(ti.modified()).toBe(false);

  // change field being indexed
  df.update(fi, va).run();
  map = ti.value;
  expect(map.size).toBe(3);
  expect(map.get('foo')).toBe(data[0]);
  expect(map.get('boo')).toBe(data[1]);
  expect(map.get('baz')).toBe(data[2]);
  expect(map.get(2)).toBe(undefined);
  expect(map.get(3)).toBe(undefined);
  expect(map.get(5)).toBe(undefined);
  expect(ti.modified()).toBe(true);

  // remove data
  df.pulse(c0, changeset().remove(data[1])).run();
  expect(map.size).toBe(2);
  expect(map.get('foo')).toBe(data[0]);
  expect(map.get('boo')).toBe(undefined);
  expect(map.get('baz')).toBe(data[2]);
  expect(ti.modified()).toBe(true);
});

test('TupleIndex does not leak memory', function() {
  var df = new vega.Dataflow(),
      c0 = df.add(Collect),
      ti = df.add(TupleIndex, {field: util.field('id'), pulse: c0}),
      n = df.cleanThreshold + 1;

  function generate() {
    for (var data = [], i=0; i<n; ++i) {
      data.push({id: i});
    }
    return data;
  }

  // burn in by filling up to threshold, then remove all
  df.pulse(c0, changeset().insert(generate())).run();
  df.pulse(c0, changeset().remove(util.truthy)).run();
  expect(ti.value.empty).toBe(0);
});

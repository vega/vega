var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    TupleIndex = tx.tupleindex;

tape('TupleIndex maintains an index of tuples', t => {
  const data = [
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
  t.equal(map.size, 3);
  t.equal(map.get(1), data[0]);
  t.equal(map.get(3), data[1]);
  t.equal(map.get(5), data[2]);
  t.equal(map.get(0), undefined);
  t.equal(ti.modified(), true);

  // change key field value
  df.pulse(c0, changeset().modify(data[0], 'id', 2)).run();
  map = ti.value;
  t.equal(map.size, 3);
  t.equal(map.get(2), data[0]);
  t.equal(map.get(3), data[1]);
  t.equal(map.get(5), data[2]);
  t.equal(map.get(1), undefined);
  t.equal(ti.modified(), true);

  // change non-key field value
  df.pulse(c0, changeset().modify(data[1], 'value', 'boo')).run();
  map = ti.value;
  t.equal(map.size, 3);
  t.equal(map.get(2), data[0]);
  t.equal(map.get(3), data[1]);
  t.equal(map.get(5), data[2]);
  t.equal(map.get(1), undefined);
  t.equal(ti.modified(), true); // should signal changes to data

  // do nothing
  df.touch(c0).touch(ti).run();
  map = ti.value;
  t.equal(map.size, 3);
  t.equal(ti.modified(), false);

  // change field being indexed
  df.update(fi, va).run();
  map = ti.value;
  t.equal(map.size, 3);
  t.equal(map.get('foo'), data[0]);
  t.equal(map.get('boo'), data[1]);
  t.equal(map.get('baz'), data[2]);
  t.equal(map.get(2), undefined);
  t.equal(map.get(3), undefined);
  t.equal(map.get(5), undefined);
  t.equal(ti.modified(), true);

  // remove data
  df.pulse(c0, changeset().remove(data[1])).run();
  t.equal(map.size, 2);
  t.equal(map.get('foo'), data[0]);
  t.equal(map.get('boo'), undefined);
  t.equal(map.get('baz'), data[2]);
  t.equal(ti.modified(), true);

  t.end();
});

tape('TupleIndex does not leak memory', t => {
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
  t.equal(ti.value.empty, 0, 'Zero empty map entries');

  t.end();
});

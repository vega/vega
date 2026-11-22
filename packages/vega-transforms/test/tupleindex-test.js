import tape from 'tape';
import { Dataflow, changeset } from 'vega-dataflow';
import { field, truthy } from 'vega-util';
import { collect as Collect, tupleindex as TupleIndex } from '../index.js';

tape('TupleIndex maintains an index of tuples', t => {
  const data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var id = field('id'),
      va = field('value'),
      df = new Dataflow(),
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

tape('TupleIndex keeps a key while other tuples with that key remain', t => {
  const a = {'id': 1, 'value': 'a'},
        b = {'id': 2, 'value': 'b'};

  function setup(data) {
    const df = new Dataflow(),
          c0 = df.add(Collect),
          ti = df.add(TupleIndex, {field: field('id'), pulse: c0});
    df.pulse(c0, changeset().insert(data)).run();
    return {df, c0, ti};
  }

  // insert a duplicate key, then remove the duplicate
  let {df, c0, ti} = setup([a, b]);
  const a2 = {'id': 1, 'value': 'a2'};
  df.pulse(c0, changeset().insert(a2)).run();
  df.pulse(c0, changeset().remove(a2)).run();
  t.equal(ti.value.size, 2);
  t.equal(ti.value.get(1), a);

  // replace in two steps: insert the new version, then remove the old
  ({df, c0, ti} = setup([a, b]));
  df.pulse(c0, changeset().insert(a2)).run();
  df.pulse(c0, changeset().remove(a)).run();
  t.equal(ti.value.size, 2);
  t.equal(ti.value.get(1), a2);

  // three tuples for one key: remove the oldest, then the newest
  ({df, c0, ti} = setup([a, b]));
  const a3 = {'id': 1, 'value': 'a3'};
  df.pulse(c0, changeset().insert(a2)).run();
  df.pulse(c0, changeset().insert(a3)).run();
  df.pulse(c0, changeset().remove(a)).run();
  df.pulse(c0, changeset().remove(a3)).run();
  t.equal(ti.value.get(1), a2);

  // initial duplicates: remove the last one
  ({df, c0, ti} = setup([a, b, a2]));
  t.equal(ti.value.get(1), a2);
  df.pulse(c0, changeset().remove(a2)).run();
  t.equal(ti.value.get(1), a);

  // remove every tuple for a key
  df.pulse(c0, changeset().remove(a)).run();
  t.equal(ti.value.size, 1);
  t.equal(ti.value.get(1), undefined);
  t.equal(ti.value.get(2), b);

  // replace within one changeset (already works; included as a regression check)
  ({df, c0, ti} = setup([a, b]));
  df.pulse(c0, changeset().insert(a2).remove(a)).run();
  t.equal(ti.value.size, 2);
  t.equal(ti.value.get(1), a2);

  t.end();
});

tape('TupleIndex does not leak memory', t => {
  var df = new Dataflow(),
      c0 = df.add(Collect),
      ti = df.add(TupleIndex, {field: field('id'), pulse: c0}),
      n = df.cleanThreshold + 1;

  function generate() {
    for (var data = [], i=0; i<n; ++i) {
      data.push({id: i});
    }
    return data;
  }

  // burn in by filling up to threshold, then remove all
  df.pulse(c0, changeset().insert(generate())).run();
  df.pulse(c0, changeset().remove(truthy)).run();
  t.equal(ti.value.empty, 0, 'Zero empty map entries');

  t.end();
});

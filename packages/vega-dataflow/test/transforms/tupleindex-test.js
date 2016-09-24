var tape = require('tape'),
    util = require('vega-util'),
    vega = require('../../'),
    changeset = vega.changeset,
    Collect = vega.transforms.Collect,
    TupleIndex = vega.transforms.TupleIndex;

function size(map) {
  var count = 0, key;
  for (key in map) if (map[key] != null) ++count;
  return count;
}

tape('TupleIndex maintains an index of tuples', function(test) {
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
  test.equal(size(map), 3);
  test.equal(map[1], data[0]);
  test.equal(map[3], data[1]);
  test.equal(map[5], data[2]);
  test.equal(map[0], undefined);
  test.equal(ti.modified(), true);

  // change key field value
  df.pulse(c0, changeset().modify(data[0], 'id', 2)).run();
  map = ti.value;
  test.equal(size(map), 3);
  test.equal(map[2], data[0]);
  test.equal(map[3], data[1]);
  test.equal(map[5], data[2]);
  test.equal(map[1], undefined);
  test.equal(ti.modified(), true);

  // change non-key field value
  df.pulse(c0, changeset().modify(data[1], 'value', 'boo')).run();
  map = ti.value;
  test.equal(size(map), 3);
  test.equal(map[2], data[0]);
  test.equal(map[3], data[1]);
  test.equal(map[5], data[2]);
  test.equal(map[1], undefined);
  test.equal(ti.modified(), true); // should signal changes to data

  // do nothing
  df.touch(c0).touch(ti).run();
  map = ti.value;
  test.equal(size(map), 3);
  test.equal(ti.modified(), false);

  // change field being indexed
  df.update(fi, va).run();
  map = ti.value;
  test.equal(size(map), 3);
  test.equal(map['foo'], data[0]);
  test.equal(map['boo'], data[1]);
  test.equal(map['baz'], data[2]);
  test.equal(map[2], undefined);
  test.equal(map[3], undefined);
  test.equal(map[5], undefined);
  test.equal(ti.modified(), true);

  // remove data
  df.pulse(c0, changeset().remove(data[1])).run();
  test.equal(size(map), 2);
  test.equal(map['foo'], data[0]);
  test.equal(map['boo'], undefined);
  test.equal(map['baz'], data[2]);
  test.equal(ti.modified(), true);

  test.end();
});

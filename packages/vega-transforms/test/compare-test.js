import tape from 'tape';
import { Dataflow } from 'vega-dataflow';
import { compare as Compare } from '../index.js';

tape('Compare generates comparator functions', t => {
  var df = new Dataflow(),
      c = df.add('foo'),
      o = df.add('ascending'),
      f = df.add(Compare, {fields:c, orders:o});

  df.run();
  t.equal(typeof f.value, 'function');
  t.deepEqual(f.value.fields, ['foo']);

  df.update(o, 'descending').run();
  t.equal(typeof f.value, 'function');
  t.deepEqual(f.value.fields, ['foo']);

  df.update(c, 'bar').run();
  t.equal(typeof f.value, 'function');
  t.deepEqual(f.value.fields, ['bar']);

  df.update(c, ['foo', 'bar'])
    .update(o, ['descending', 'descending'])
    .run();
  t.equal(typeof f.value, 'function');
  t.deepEqual(f.value.fields, ['foo', 'bar']);

  df.update(c, null).update(o, null).run();
  t.equal(f.value, null);

  t.end();
});

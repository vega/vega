import tape from 'tape';
import {accessorFields, accessorName} from 'vega-util';
import {Dataflow} from 'vega-dataflow';
import {field as Field} from '../index.js';

tape('Field generates field accessors', t => {
  var df = new Dataflow(),
      n = df.add('foo'),
      a = df.add(null),
      f = df.add(Field, {name:n, as:a});

  df.run();
  t.equal(typeof f.value, 'function');
  t.equal(accessorName(f.value), 'foo');
  t.deepEqual(accessorFields(f.value), ['foo']);

  df.update(n, 'bar').run();
  t.equal(typeof f.value, 'function');
  t.equal(accessorName(f.value), 'bar');
  t.deepEqual(accessorFields(f.value), ['bar']);

  df.update(a, 'baz').run();
  t.equal(typeof f.value, 'function');
  t.equal(accessorName(f.value), 'baz');
  t.deepEqual(accessorFields(f.value), ['bar']);

  df.update(n, ['foo', 'bar']).run();
  t.equal(Array.isArray(f.value), true);
  t.deepEqual(f.value.map(accessorName), ['foo', 'bar']);
  t.deepEqual(
    f.value.map(accessorFields),
    [['foo'], ['bar']]);

  t.end();
});

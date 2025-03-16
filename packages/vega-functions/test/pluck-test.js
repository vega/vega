import tape from 'tape';
import { pluck } from '../index.js';

tape('pluck plucks values from an array', t => {
  const data = [
    { foo: 1, bar: { baz: 'a' }},
    { foo: 2, bar: { baz: 'b' }},
    { foo: 3, bar: { baz: 'c' }}
  ];
  t.deepEqual(pluck(data, 'foo'), [1, 2, 3]);
  t.deepEqual(pluck(data, 'bar.baz'), ['a', 'b', 'c']);
  t.deepEqual(pluck(data, 'bop'), [undefined, undefined, undefined]);
  t.end();
});
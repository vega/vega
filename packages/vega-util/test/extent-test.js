import tape from 'tape';
import * as vega from '../build/index.js';

tape('extent calculates array extents', t => {
  t.deepEqual(vega.extent([0, 0, 0]), [0, 0]);
  t.deepEqual(vega.extent([4, -1, 2]), [-1, 4]);
  t.deepEqual(vega.extent([4, -1, null, undefined, NaN, 2]), [-1, 4]);
  t.deepEqual(vega.extent([]), [undefined, undefined]);
  t.deepEqual(vega.extent([null, undefined, NaN]), [undefined, undefined]);
  t.end();
});

tape('extent calculates array extents with an accessor', t => {
  const f = d => d.v;
  t.deepEqual(vega.extent([{v: 4}, {v: -1}, {v: 2}], f), [-1, 4]);
  t.deepEqual(vega.extent([{v: null}, {v: 4}, {v: NaN}, {v: -1}], f), [-1, 4]);
  t.deepEqual(vega.extent([], f), [undefined, undefined]);
  t.deepEqual(vega.extent([{v: null}, {v: undefined}, {v: NaN}], f), [undefined, undefined]);
  t.end();
});

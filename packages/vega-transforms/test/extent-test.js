import tape from 'tape';
import {field} from 'vega-util';
import {Dataflow, changeset} from 'vega-dataflow';
import {collect as Collect, extent as Extent} from '../index.js';

tape('Extent computes extents', t => {
  const data = [
    {'x': 0, 'y': 28}, {'x': 1, 'y': 43},
    {'x': 0, 'y': 55}, {'x': 1, 'y': 72}
  ];

  var x = field('x'),
      y = field('y'),
      df = new Dataflow(),
      f = df.add(null),
      c = df.add(Collect),
      a = df.add(Extent, {field:f, pulse:c}),
      b = df.add(Extent, {field:y, pulse:c});

  df.update(f, x)
    .pulse(c, changeset().insert(data))
    .run();
  t.deepEqual(a.value, [0, 1]);
  t.deepEqual(b.value, [28, 72]);

  df.update(f, y).run();
  t.deepEqual(a.value, [28, 72]);
  t.deepEqual(b.value, [28, 72]);

  t.end();
});

tape('Extent handles empty and invalid data', t => {
  var x = field('x'),
      df = new Dataflow(),
      c = df.add(Collect),
      e = df.add(Extent, {field:x, pulse:c});

  df.pulse(c, changeset().insert([])).run();
  t.deepEqual(e.value, [undefined, undefined]);

  df.pulse(c, changeset().insert([
    {x: NaN}, {x: null}, {x: undefined}, {x: ''}
  ])).run();
  t.deepEqual(e.value, [undefined, undefined]);

  t.end();
});

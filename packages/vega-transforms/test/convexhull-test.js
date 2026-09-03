import tape from 'tape';
import {field} from 'vega-util';
import {Dataflow, changeset} from 'vega-dataflow';
import {collect as Collect, convexhull as ConvexHull} from '../index.js';

tape('ConvexHull generates grouped hull points', t => {
  const data = [
    {g: 'a', x: 0, y: 0},
    {g: 'a', x: 10, y: 0},
    {g: 'a', x: 10, y: 10},
    {g: 'a', x: 0, y: 10},
    {g: 'a', x: 5, y: 5},
    {g: 'b', x: 0, y: 0},
    {g: 'b', x: 2, y: 0},
    {g: 'b', x: 1, y: 1}
  ];

  const df = new Dataflow(),
        c0 = df.add(Collect),
        hull = df.add(ConvexHull, {
          x: field('x'),
          y: field('y'),
          groupby: [field('g')],
          pulse: c0
        });

  df.pulse(c0, changeset().insert(data)).run();

  t.deepEqual(hull.pulse.add, [
    {g: 'a', x: 0, y: 0, x0: 0, y0: 0},
    {g: 'a', x: 10, y: 0, x0: 10, y0: 0},
    {g: 'a', x: 10, y: 10, x0: 10, y0: 10},
    {g: 'a', x: 0, y: 10, x0: 0, y0: 10},
    {g: 'b', x: 0, y: 0, x0: 0, y0: 0},
    {g: 'b', x: 2, y: 0, x0: 2, y0: 0},
    {g: 'b', x: 1, y: 1, x0: 1, y0: 1}
  ]);
  t.end();
});

tape('ConvexHull supports offset hull points', t => {
  const data = [
    {x: 0, y: 0},
    {x: 10, y: 0},
    {x: 10, y: 10},
    {x: 0, y: 10},
    {x: 5, y: 5}
  ];

  const df = new Dataflow(),
        c0 = df.add(Collect),
        hull = df.add(ConvexHull, {
          x: field('x'),
          y: field('y'),
          offset: 1,
          pulse: c0
        });

  df.pulse(c0, changeset().insert(data)).run();

  t.deepEqual(hull.pulse.add, [
    {x: -1, y: -1, x0: 0, y0: 0},
    {x: 11, y: -1, x0: 10, y0: 0},
    {x: 11, y: 11, x0: 10, y0: 10},
    {x: -1, y: 11, x0: 0, y0: 10}
  ]);
  t.end();
});

tape('ConvexHull updates generated hull points', t => {
  const data = [
    {x: 0, y: 0},
    {x: 1, y: 0},
    {x: 0, y: 1}
  ];

  const df = new Dataflow(),
        c0 = df.add(Collect),
        hull = df.add(ConvexHull, {
          x: field('x'),
          y: field('y'),
          pulse: c0
        });

  df.pulse(c0, changeset().insert(data)).run();
  t.equal(hull.pulse.add.length, 3);

  df.pulse(c0, changeset().insert({x: 2, y: 2})).run();
  t.equal(hull.pulse.rem.length, 3);
  t.deepEqual(hull.pulse.add, [
    {x: 0, y: 0, x0: 0, y0: 0},
    {x: 1, y: 0, x0: 1, y0: 0},
    {x: 2, y: 2, x0: 2, y0: 2},
    {x: 0, y: 1, x0: 0, y0: 1}
  ]);
  t.end();
});

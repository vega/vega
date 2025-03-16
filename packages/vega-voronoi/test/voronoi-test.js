import tape from 'tape';
import {field} from 'vega-util';
import { Dataflow, changeset } from 'vega-dataflow';
import { voronoi as Voronoi } from '../index.js';
import {collect as Collect} from 'vega-transforms';

tape('Voronoi generates voronoi cell paths', t => {
  const data = [
    {x: 10, y: 10},
    {x: 20, y: 10},
    {x: 10, y: 20}
  ];

  const x = field('x'),
      y = field('y'),
      df = new Dataflow(),
      c0 = df.add(Collect),
      vo = df.add(Voronoi, {
        x: x,
        y: y,
        size: [30, 20],
        pulse: c0
      });

  df.pulse(c0, changeset().insert(data)).run();
  const out = vo.pulse.add;
  t.equal(out[0].path, 'M0,0L15,0L15,15L0,15Z');
  t.equal(out[1].path, 'M30,0L30,20L20,20L15,15L15,0Z');
  t.equal(out[2].path, 'M0,20L0,15L15,15L20,20Z');
  t.end();
});

tape('Voronoi generates voronoi cell paths with 1 input point', t => {
  const data = [
    {x: 10, y: 10}
  ];

  const x = field('x'),
      y = field('y'),
      df = new Dataflow(),
      c0 = df.add(Collect),
      vo = df.add(Voronoi, {
        x: x,
        y: y,
        size: [30, 20],
        pulse: c0
      });

  df.pulse(c0, changeset().insert(data)).run();
  const out = vo.pulse.add;
  t.equal(out[0].path, 'M30,0L30,20L0,20L0,0Z');
  t.end();
});

tape('Voronoi generates voronoi cell paths with 2 input points', t => {
  const data = [
    {x: 10, y: 10},
    {x: 20, y: 10}
  ];

  const x = field('x'),
      y = field('y'),
      df = new Dataflow(),
      c0 = df.add(Collect),
      vo = df.add(Voronoi, {
        x: x,
        y: y,
        size: [30, 20],
        pulse: c0
      });

  df.pulse(c0, changeset().insert(data)).run();
  const out = vo.pulse.add;
  t.equal(out[0].path, 'M0,20L0,0L15,0L15,20Z');
  t.equal(out[1].path, 'M30,0L30,20L15,20L15,0Z');
  t.end();
});

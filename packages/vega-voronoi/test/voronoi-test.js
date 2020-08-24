const tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Voronoi = require('../').voronoi,
    Collect = require('vega-transforms').collect,
    changeset = vega.changeset;

tape('Voronoi generates voronoi cell paths', t => {
  const data = [
    {x: 10, y: 10},
    {x: 20, y: 10},
    {x: 10, y: 20}
  ];

  const x = util.field('x'),
      y = util.field('y'),
      df = new vega.Dataflow(),
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

  const x = util.field('x'),
      y = util.field('y'),
      df = new vega.Dataflow(),
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

  const x = util.field('x'),
      y = util.field('y'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      vo = df.add(Voronoi, {
        x: x,
        y: y,
        size: [30, 20],
        pulse: c0
      });

  df.pulse(c0, changeset().insert(data)).run();
  const out = vo.pulse.add;
  t.equal(out[0].path, 'M15,20L0,20L0,0L15,0Z');
  t.equal(out[1].path, 'M15,20L15,0L30,0L30,20Z');
  t.end();
});

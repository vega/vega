var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Voronoi = require('../').voronoi,
    Collect = require('vega-transforms').collect,
    changeset = vega.changeset;

tape('Voronoi generates voronoi cell paths', function(t) {
  var data = [
    {x: 10, y: 10},
    {x: 20, y: 10},
    {x: 10, y: 20}
  ];

  var x = util.field('x'),
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
  var out = vo.pulse.add;
  t.equal(out[0].path, 'M0,0L15,0L15,15L0,15L0,0Z');
  t.equal(out[1].path, 'M30,0L30,20L20,20L15,15L15,0L30,0Z');
  t.equal(out[2].path, 'M0,20L0,15L15,15L20,20L0,20Z');
  t.end();
});

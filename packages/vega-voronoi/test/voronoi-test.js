var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Voronoi = require('../').voronoi,
    Collect = require('vega-transforms').collect,
    changeset = vega.changeset;

tape('Voronoi generates voronoi cell paths', function(test) {
  var data = [
    {x: 10, y: 10},
    {x: 20, y: 10}
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
  test.equal(out[0].path, 'M15,20L15,0L0,0L0,20Z');
  test.equal(out[1].path, 'M15,0L15,20L30,20L30,0Z');
  test.end();
});

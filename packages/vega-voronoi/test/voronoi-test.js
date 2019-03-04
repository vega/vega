var util = require('vega-util');
var vega = require('vega-dataflow');
var Voronoi = require('../').voronoi;
var Collect = require('vega-transforms').collect;
var changeset = vega.changeset;

test('Voronoi generates voronoi cell paths', function() {
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
  expect(out[0].path).toBe('M15,20L15,0L0,0L0,20Z');
  expect(out[1].path).toBe('M15,0L15,20L30,20L30,0Z');
});

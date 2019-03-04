var vega = require('vega-dataflow'), Collect = require('vega-transforms').collect, Force = require('../').force;

test('Force places points', function() {
  var data = [
    {label: 'a'},
    {label: 'b'},
    {label: 'c'},
    {label: 'd'}
  ];

  var df = new vega.Dataflow(),
      c0 = df.add(Collect);

  df.add(Force, {
    static: true,
    forces: [
      {force: 'x', x: 100},
      {force: 'y', y: 100},
      {force: 'nbody'}
    ],
    pulse: c0
  });

  df.pulse(c0, vega.changeset().insert(data)).run();
  expect(c0.value.length).toBe(data.length);

  for (var i=0, n=data.length; i<n; ++i) {
    expect(data[i].x != null && !isNaN(data[i].x)).toBeTruthy();
    expect(data[i].y != null && !isNaN(data[i].y)).toBeTruthy();
  }
});

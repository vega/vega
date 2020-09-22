var tape = require('tape'),
    vega = require('vega-dataflow'),
    Collect = require('vega-transforms').collect,
    Force = require('../').force;

tape('Force places points', t => {
  const data = [
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
  t.equal(c0.value.length, data.length);

  for (var i=0, n=data.length; i<n; ++i) {
    t.ok(data[i].x != null && !Number.isNaN(data[i].x));
    t.ok(data[i].y != null && !Number.isNaN(data[i].y));
  }

  t.end();
});

var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Collect = require('vega-transforms').collect,
    Regression = require('../').regression,
    changeset = vega.changeset;

tape('Regression fits linear regression model', function(t) {
  var data = [
    {k: 'a', u: 2, v: 2}, {k: 'a', u: 1, v: 1},
    {k: 'b', u: 3, v: 2}, {k: 'b', u: 2, v: 1}
  ];

  var k = util.field('k'),
      u = util.field('u'),
      v = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      reg = df.add(Regression, {
        method: 'linear',
        groupby: [k],
        x: u,
        y: v,
        pulse: col
      }),
      out = df.add(Collect, {pulse: reg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  var d = out.value;
  t.equal(d.length, 4);

  t.equal(d[0].k, 'a');
  t.equal(d[0].u, 1);
  t.equal(d[0].v, 1);

  t.equal(d[1].k, 'a');
  t.equal(d[1].u, 2);
  t.equal(d[1].v, 2);

  t.equal(d[2].k, 'b');
  t.equal(d[2].u, 2);
  t.equal(d[2].v, 1);

  t.equal(d[3].k, 'b');
  t.equal(d[3].u, 3);
  t.equal(d[3].v, 2);

  t.end();
});
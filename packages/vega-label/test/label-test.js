var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Collect = require('vega-transforms').collect,
    Label = require('../').label;

tape('Label performs point label layout', function(t) {
  function data() {
    return [
      {text: 'foo', x: 20, y: 10, fontSize: 10},
      {text: 'bar', x: 30, y: 10, fontSize: 10}
    ]
  }

  var df = new vega.Dataflow(),
      an = df.add('left'),
      c0 = df.add(Collect),
      lb = df.add(Label, {
        size: [50, 20],
        anchor: an,
        offset: 1,
        pulse: c0
      });

  df.pulse(c0, vega.changeset().insert(data())).run();
  t.equal(lb.stamp, df.stamp());
  var out = c0.value;
  t.equal(out.length, data().length);
  t.equal(out[0].x, 19);
  t.equal(out[0].y, 10);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'right')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out[0].opacity, 0);
  t.equal(out[1].x, 31);
  t.equal(out[1].y, 10);
  t.equal(out[1].align, 'left');
  t.equal(out[1].baseline, 'middle');
  t.equal(out[1].opacity, 1);

  df.update(an, 'top')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out[0].opacity, 0);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out[0].opacity, 0);
  t.equal(out[1].opacity, 0);

  t.end();
});
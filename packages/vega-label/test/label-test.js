var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Bounds = require('vega-scenegraph').Bounds,
    Collect = require('vega-transforms').collect,
    Label = require('../').label;

function closeTo(t, a, b) {
  t.equal(a && a.toFixed(14), b && b.toFixed(14));
}

tape('Label performs label layout over input points', t => {
  function data() {
    return [
      {text: 'foo', x: 20, y: 15, fontSize: 10},
      {text: 'bar', x: 30, y: 15, fontSize: 10}
    ];
  }

  var df = new vega.Dataflow(),
      an = df.add('left'),
      c0 = df.add(Collect),
      lb = df.add(Label, {
        size: [50, 30],
        anchor: [an],
        offset: [2],
        pulse: c0
      });

  df.update(an, 'left')
    .pulse(c0, vega.changeset().insert(data()))
    .run();
  t.equal(lb.stamp, df.stamp());
  let out = c0.value;
  t.equal(out.length, data().length);
  closeTo(t, out[0].x, 18);
  closeTo(t, out[0].y, 15);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'right')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out[0].opacity, 0);
  closeTo(t, out[1].x, 32);
  closeTo(t, out[1].y, 15);
  t.equal(out[1].align, 'left');
  t.equal(out[1].baseline, 'middle');
  t.equal(out[1].opacity, 1);

  df.update(an, 'top')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20);
  closeTo(t, out[0].y, 13);
  t.equal(out[0].align, 'center');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20);
  closeTo(t, out[0].y, 17);
  t.equal(out[0].align, 'center');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'top-left')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 - 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 - 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'top-right')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 + 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 - 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom-left')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 - 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 + 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom-right')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 + 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 + 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  t.end();
});

tape('Label performs label layout with base mark reactive geometry', t => {
  function data() {
    return [
      {
        text: 'foo', fontSize: 10,
        datum: {
          x: 20, y: 15, width: 2, height: 2, fill: 'black',
          bounds: new Bounds().set(20, 15, 22, 17),
          mark: {marktype: 'rect'}
        }
      },
      {
        text: 'bar', fontSize: 10,
        datum: {
          x: 30, y: 15, width: 2, height: 2, fill: 'black',
          bounds: new Bounds().set(30, 15, 32, 17),
          mark: {marktype: 'rect'}
        }
      }
    ];
  }

  var df = new vega.Dataflow(),
      an = df.add('left'),
      c0 = df.add(Collect),
      lb = df.add(Label, {
        size: [50, 30],
        anchor: [an],
        offset: [2],
        pulse: c0
      });

  df.update(an, 'left')
    .pulse(c0, vega.changeset().insert(data()))
    .run();
  t.equal(lb.stamp, df.stamp());
  let out = c0.value;
  t.equal(out.length, data().length);
  closeTo(t, out[0].x, 18);
  closeTo(t, out[0].y, 16);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'right')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out[0].opacity, 0);
  closeTo(t, out[1].x, 34);
  closeTo(t, out[1].y, 16);
  t.equal(out[1].align, 'left');
  t.equal(out[1].baseline, 'middle');
  t.equal(out[1].opacity, 1);

  df.update(an, 'top')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 21);
  closeTo(t, out[0].y, 13);
  t.equal(out[0].align, 'center');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 21);
  closeTo(t, out[0].y, 19);
  t.equal(out[0].align, 'center');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'top-left')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 - 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 - 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'top-right')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 22 + 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 - 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom-left')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 - 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 17 + 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom-right')
    .pulse(c0, vega.changeset().remove(util.truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 22 + 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 17 + 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  t.end();
});

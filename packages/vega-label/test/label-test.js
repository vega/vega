import tape from 'tape';
import { truthy } from 'vega-util';
import { Dataflow, changeset } from 'vega-dataflow';
import {Bounds} from 'vega-scenegraph';
import {collect as Collect} from 'vega-transforms';
import { label as Label } from '../index.js';

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

  const df = new Dataflow(),
        an = df.add('left'),
        c0 = df.add(Collect),
        lb = df.add(Label, {
          size: [50, 30],
          anchor: [an],
          offset: [2],
          pulse: c0
        });

  df.update(an, 'left')
    .pulse(c0, changeset().insert(data()))
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
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out[0].opacity, 0);
  closeTo(t, out[1].x, 32);
  closeTo(t, out[1].y, 15);
  t.equal(out[1].align, 'left');
  t.equal(out[1].baseline, 'middle');
  t.equal(out[1].opacity, 1);

  df.update(an, 'top')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20);
  closeTo(t, out[0].y, 13);
  t.equal(out[0].align, 'center');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20);
  closeTo(t, out[0].y, 17);
  t.equal(out[0].align, 'center');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'top-left')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 - 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 - 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'top-right')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 + 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 - 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom-left')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 - 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 + 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom-right')
    .pulse(c0, changeset().remove(truthy).insert(data()))
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

  const df = new Dataflow(),
        an = df.add('left'),
        c0 = df.add(Collect),
        avoidBaseMark = df.add(true),
        lb = df.add(Label, {
          size: [50, 30],
          anchor: [an],
          offset: [2],
          pulse: c0,
          avoidBaseMark
        });

  df.update(an, 'left')
    .pulse(c0, changeset().insert(data()))
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
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out[0].opacity, 0);
  closeTo(t, out[1].x, 34);
  closeTo(t, out[1].y, 16);
  t.equal(out[1].align, 'left');
  t.equal(out[1].baseline, 'middle');
  t.equal(out[1].opacity, 1);

  df.update(an, 'top')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 21);
  closeTo(t, out[0].y, 13);
  t.equal(out[0].align, 'center');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 21);
  closeTo(t, out[0].y, 19);
  t.equal(out[0].align, 'center');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'top-left')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 - 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 - 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'top-right')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 22 + 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 15 - 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'bottom');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom-left')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 20 - 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 17 + 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'bottom-right')
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 22 + 2 * Math.SQRT1_2);
  closeTo(t, out[0].y, 17 + 2 * Math.SQRT1_2);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'top');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  df.update(an, 'middle')
    .update(avoidBaseMark, true)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out[0].opacity, 0);
  t.equal(out[1].opacity, 0);

  df.update(an, 'middle')
    .update(avoidBaseMark, false)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  closeTo(t, out[0].x, 21);
  closeTo(t, out[0].y, 16);
  t.equal(out[0].align, 'center');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  t.end();
});

tape('Label performs label layout over input point with infinity padding', t => {
  function data() {
    return [
      {text: 'very-long-label', x: 5, y: 5, fontSize: 10}
    ];
  }

  const df = new Dataflow(),
        pd = df.add(Infinity),
        an = df.add('left'),
        c0 = df.add(Collect),
        lb = df.add(Label, {
          size: [10, 10],
          anchor: [an],
          offset: [2],
          padding: pd,
          pulse: c0
        });

  df.update(an, 'left')
    .update(pd, Infinity)
    .pulse(c0, changeset().insert(data()))
    .run();
  t.equal(lb.stamp, df.stamp());
  let out = c0.value;
  t.equal(out.length, data().length);
  closeTo(t, out[0].x, 3);
  closeTo(t, out[0].y, 5);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);

  df.update(an, 'right')
    .update(pd, Infinity)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out.length, data().length);
  closeTo(t, out[0].x, 7);
  closeTo(t, out[0].y, 5);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);

  df.update(an, 'left')
    .update(pd, 0)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out.length, data().length);
  t.equal(out[0].opacity, 0);

  df.update(an, 'right')
    .update(pd, 0)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out.length, data().length);
  t.equal(out[0].opacity, 0);

  df.update(an, 'left')
    .update(pd, null)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out.length, data().length);
  closeTo(t, out[0].x, 3);
  closeTo(t, out[0].y, 5);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);

  df.update(an, 'right')
    .update(pd, null)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out.length, data().length);
  closeTo(t, out[0].x, 7);
  closeTo(t, out[0].y, 5);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);

  df.update(an, 'left')
    .update(pd, 5)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out.length, data().length);
  t.equal(out[0].opacity, 0);

  df.update(an, 'right')
    .update(pd, 5)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out.length, data().length);
  t.equal(out[0].opacity, 0);

  df.update(an, 'left')
    .update(pd, 100)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out.length, data().length);
  closeTo(t, out[0].x, 3);
  closeTo(t, out[0].y, 5);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);

  df.update(an, 'right')
    .update(pd, 100)
    .pulse(c0, changeset().remove(truthy).insert(data()))
    .run();
  out = c0.value;
  t.equal(out.length, data().length);
  closeTo(t, out[0].x, 7);
  closeTo(t, out[0].y, 5);
  t.equal(out[0].align, 'left');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);

  t.end();
});

tape('Label performs label layout over input multiple points outside of chart\'s bounding box with infinity padding', t => {
  function data() {
    return [
      {text: 'l', x: 0, y: 5, fontSize: 10},
      {text: 'l', x: 9, y: 5, fontSize: 10}
    ];
  }

  const df = new Dataflow(),
        pd = df.add(Infinity),
        an = df.add('left'),
        c0 = df.add(Collect),
        lb = df.add(Label, {
          size: [10, 10],
          anchor: [an],
          offset: [10],
          padding: pd,
          pulse: c0
        });

  df.update(an, 'left')
    .update(pd, Infinity)
    .pulse(c0, changeset().insert(data()))
    .run();

  t.equal(lb.stamp, df.stamp());
  const out = c0.value;
  t.equal(out.length, data().length);
  closeTo(t, out[0].x, -10);
  closeTo(t, out[0].y, 5);
  t.equal(out[0].align, 'right');
  t.equal(out[0].baseline, 'middle');
  t.equal(out[0].opacity, 1);

  closeTo(t, out[1].x, -1);
  closeTo(t, out[1].y, 5);
  t.equal(out[1].align, 'right');
  t.equal(out[1].baseline, 'middle');
  t.equal(out[1].opacity, 1);

  t.end();
});
tape('Label avoids previously placed labels for inside anchors', t => {
  function data() {
    const mk = id => ({
      text: id, fontSize: 10,
      datum: {
        x: 10, y: 10, width: 80, height: 20, fill: '#ddd',
        bounds: new Bounds().set(10, 10, 90, 30),
        mark: {marktype: 'rect'}
      }
    });
    return [mk('first'), mk('second')];
  }

  const df = new Dataflow(),
        c0 = df.add(Collect),
        lb = df.add(Label, {
          size: [100, 40],
          anchor: ['middle'],
          offset: [1],
          pulse: c0
        });

  df.pulse(c0, changeset().insert(data())).run();
  t.equal(lb.stamp, df.stamp());
  const out = c0.value;
  t.equal(out.length, 2);
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  t.end();
});

tape('Label re-runs layout when input items are modified', t => {
  // reactive geometry: base mark bounds are encoded from the data, so the
  // label anchor (datum.bounds) is not overwritten by layout output
  function mk(id, x1, x2) {
    return {
      text: id, fontSize: 10,
      datum: {
        x: x1, y: 15, width: x2 - x1, height: 20,
        bounds: new Bounds().set(x1, 15, x2, 35),
        mark: {marktype: 'rect'}
      }
    };
  }

  const df = new Dataflow(),
        c0 = df.add(Collect),
        lb = df.add(Label, {
          size: [100, 40],
          anchor: ['top'],
          offset: [2],
          pulse: c0
        });

  df.pulse(c0, changeset().insert([mk('foo', 10, 50), mk('bar', 10, 50)])).run();
  t.equal(lb.stamp, df.stamp());
  const out = c0.value;
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);
  closeTo(t, out[0].x, 30);

  // move the second base mark to the right without adding or removing any
  // items: a modify-only pulse that changes what the layout reads should
  // re-run the layout and place its label
  df.pulse(c0, changeset().modify(out[1], 'datum', mk('bar', 55, 95).datum)).run();
  t.equal(lb.stamp, df.stamp());
  t.equal(out[1].opacity, 1);
  closeTo(t, out[1].x, 75);

  // the unmodified item keeps its placed position: the anchor is re-encoded
  // from the data, so re-running does not drift the label
  closeTo(t, out[0].x, 30);

  t.end();
});

tape('Label re-runs layout when plain-data items are modified', t => {
  function data() {
    return [
      {text: 'foo', x: 20, y: 15, fontSize: 10},
      {text: 'bar', x: 30, y: 15, fontSize: 10}
    ];
  }

  const df = new Dataflow(),
        c0 = df.add(Collect),
        lb = df.add(Label, {
          size: [80, 30],
          anchor: ['left'],
          offset: [2],
          pulse: c0
        });

  df.pulse(c0, changeset().insert(data())).run();
  t.equal(lb.stamp, df.stamp());
  const out = c0.value;
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);

  // move the second item away from the first label without adding or
  // removing any items: its label should now be placed. The unmodified
  // item's x still drifts here: on plain data the anchor (x) is also the
  // layout output, so a re-run anchors on the previous label position.
  df.pulse(c0, changeset().modify(d => d.text === 'bar', 'x', 70)).run();
  t.equal(lb.stamp, df.stamp());
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 1);
  closeTo(t, out[1].x, 68);

  t.end();
});

tape('Label skips layout when a layout-irrelevant field is modified', t => {
  const data = [
    {text: 'foo', fill: 'red', x: 20, y: 15, fontSize: 10}
  ];
  const df = new Dataflow(),
        c0 = df.add(Collect),
        lb = df.add(Label, {
          size: [80, 30],
          anchor: ['left'],
          offset: [2],
          pulse: c0
        });

  df.pulse(c0, changeset().insert(data)).run();
  t.equal(lb.stamp, df.stamp());
  const out = c0.value;
  closeTo(t, out[0].x, 18);

  // a modify-only pulse touching a field the layout does not read should
  // not re-run the layout, so the placed position does not drift
  df.pulse(c0, changeset().modify(data[0], 'fill', 'blue')).run();
  t.equal(data[0].fill, 'blue');
  closeTo(t, out[0].x, 18);

  // hover-style opacity changes are preserved: the layout does not re-run
  // and overwrite the opacity output
  df.pulse(c0, changeset().modify(data[0], 'opacity', 0.3)).run();
  t.equal(out[0].opacity, 0.3);
  closeTo(t, out[0].x, 18);

  t.end();
});

tape('Label gives unplaced labels a position at the base mark center', t => {
  function data() {
    return [
      {text: 'foo', x: 20, y: 15, fontSize: 10},
      {text: 'bar', x: 20, y: 15, fontSize: 10}
    ];
  }

  const df = new Dataflow(),
        c0 = df.add(Collect);
  df.add(Label, {
    size: [50, 30],
    anchor: ['left'],
    offset: [2],
    pulse: c0
  });

  df.pulse(c0, changeset().insert(data())).run();
  const out = c0.value;
  t.equal(out[0].opacity, 1);
  t.equal(out[1].opacity, 0);
  closeTo(t, out[1].x, 20);
  closeTo(t, out[1].y, 15);
  t.equal(out[1].align, 'center');
  t.equal(out[1].baseline, 'middle');

  t.end();
});

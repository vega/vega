import tape from 'tape';
import {Bounds, boundStroke} from '../index.js';

const EPSILON = 1e-10;

function bounds() {
  return new Bounds().set(0, 0, 10, 10);
}

function boundEqual(t, b, array, msg) {
  t.ok(
    Math.abs(b.x1 - array[0]) < EPSILON &&
    Math.abs(b.y1 - array[1]) < EPSILON &&
    Math.abs(b.x2 - array[2]) < EPSILON &&
    Math.abs(b.y2 - array[3]) < EPSILON,
    msg + ' -- expected [' + array + '], got [' + [b.x1, b.y1, b.x2, b.y2] + ']'
  );
}

tape('boundStroke should not expand bounds without a stroke', t => {
  boundEqual(t, boundStroke(bounds(), {}), [0, 0, 10, 10], 'no stroke');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 0}), [0, 0, 10, 10], 'zero stroke width');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, opacity: 0}), [0, 0, 10, 10], 'zero opacity');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeOpacity: 0}), [0, 0, 10, 10], 'zero stroke opacity');
  t.end();
});

tape('boundStroke should expand bounds by half the stroke width', t => {
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4}), [-2, -2, 12, 12], 'stroke width 4');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red'}), [-0.5, -0.5, 10.5, 10.5], 'default stroke width 1');
  t.end();
});

tape('boundStroke should expand bounds for square caps', t => {
  const e = 2 * Math.SQRT2;
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeCap: 'square'}),
    [-e, -e, 10 + e, 10 + e], 'square cap');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeCap: 'round'}),
    [-2, -2, 12, 12], 'round cap');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeCap: 'butt'}),
    [-2, -2, 12, 12], 'butt cap');
  t.end();
});

tape('boundStroke should expand bounds for miter joins', t => {
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4}, true),
    [-8, -8, 18, 18], 'default miter join, default miter limit 4');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeJoin: 'miter'}, true),
    [-8, -8, 18, 18], 'explicit miter join');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeMiterLimit: 2}, true),
    [-4, -4, 14, 14], 'explicit miter limit 2');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeMiterLimit: 10}, true),
    [-20, -20, 30, 30], 'explicit miter limit 10 honored');
  t.end();
});

tape('boundStroke should not add miter slack for round or bevel joins', t => {
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeJoin: 'round'}, true),
    [-2, -2, 12, 12], 'round join');
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeJoin: 'bevel'}, true),
    [-2, -2, 12, 12], 'bevel join');
  t.end();
});

tape('boundStroke should ignore miter joins without the miter flag', t => {
  boundEqual(t, boundStroke(bounds(), {stroke: 'red', strokeWidth: 4, strokeJoin: 'miter'}),
    [-2, -2, 12, 12], 'no miter flag');
  t.end();
});

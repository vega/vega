import tape from 'tape';
import {Bounds, Marks, boundContext, boundStroke} from '../index.js';
import {symbol} from '../src/path/shapes.js';

const Epsilon = 1e-10;

const shapes = [
  'circle', 'cross', 'diamond', 'square', 'arrow', 'wedge', 'stroke',
  'triangle', 'triangle-up', 'triangle-down', 'triangle-right', 'triangle-left',
  'M-1,-1 L1,-0.5 L0.25,1 Z'
];

// Use the generic path bound as the reference implementation.
function replayBound(item) {
  const b = new Bounds();
  symbol(boundContext(b, item.angle), item);
  return boundStroke(b, item, true).translate(item.x || 0, item.y || 0);
}

function boundEqual(t, item, msg) {
  const a = replayBound(item),
        b = Marks.symbol.bound(new Bounds(), item);
  t.ok(
    Math.abs(b.x1 - a.x1) < Epsilon &&
    Math.abs(b.y1 - a.y1) < Epsilon &&
    Math.abs(b.x2 - a.x2) < Epsilon &&
    Math.abs(b.y2 - a.y2) < Epsilon,
    msg + ' -- expected [' + [a.x1, a.y1, a.x2, a.y2] + '], got [' + [b.x1, b.y1, b.x2, b.y2] + ']'
  );
}

tape('symbol bound should match the path it replaces', t => {
  shapes.forEach(shape => {
    [undefined, null, 0, 1, 10, 64, 100, 400, 2500, -100, NaN].forEach(size => {
      boundEqual(t, {x: 0, y: 0, size, shape}, shape + ' size ' + size + ' at origin');
      boundEqual(t, {x: 137.25, y: -42.5, size, shape}, shape + ' size ' + size + ' translated');
    });
  });
  t.end();
});

tape('symbol bound should match with a stroke', t => {
  ['circle', 'square', 'triangle-up', 'wedge'].forEach(shape => {
    [undefined, 0.5, 1, 3].forEach(strokeWidth => {
      [undefined, 'round', 'bevel'].forEach(strokeJoin => {
        [undefined, 'square'].forEach(strokeCap => {
          boundEqual(t,
            {x: 5, y: 7, size: 100, shape, stroke: 'red', strokeWidth, strokeJoin, strokeCap},
            shape + ' width ' + strokeWidth + ' join ' + strokeJoin + ' cap ' + strokeCap);
        });
      });
    });
    boundEqual(t, {x: 5, y: 7, size: 100, shape, stroke: 'red', strokeWidth: 4, opacity: 0},
      shape + ' zero opacity');
    boundEqual(t, {x: 5, y: 7, size: 100, shape, stroke: 'red', strokeWidth: 4, strokeOpacity: 0},
      shape + ' zero stroke opacity');
    boundEqual(t, {x: 5, y: 7, size: 100, shape, strokeWidth: 4},
      shape + ' stroke width without a stroke');
  });
  t.end();
});

tape('symbol bound should match when rotated', t => {
  ['circle', 'square', 'triangle-up', 'wedge', 'stroke'].forEach(shape => {
    [30, 45, 90, 180, -17.5].forEach(angle => {
      boundEqual(t, {x: 3, y: -9, size: 400, shape, angle, stroke: 'red', strokeWidth: 2},
        shape + ' angle ' + angle);
    });
  });
  t.end();
});

import tape from 'tape';
import {canvas} from 'vega-canvas';
import {Marks} from '../index.js';
import place from '../src/util/canvas/place.js';

function recorder() {
  const calls = [];
  const context = new Proxy({}, {
    get: (target, key) => (...args) => { calls.push([key, ...args]); }
  });
  return {context, calls};
}

const round = calls => calls.map(c => c.map(v => typeof v === 'number' ? +v.toFixed(9) : v));

tape('place moves path points without a rotation', t => {
  const {context, calls} = recorder();
  const p = place(context, 10, 20, 0);
  p.moveTo(1, 2);
  p.lineTo(3, -4);
  p.rect(1, 2, 3, 4);
  p.arc(1, 2, 5, 0, 1, true);
  p.quadraticCurveTo(1, 2, 3, 4);
  p.bezierCurveTo(1, 2, 3, 4, 5, 6);
  p.closePath();
  t.deepEqual(calls, [
    ['moveTo', 11, 22],
    ['lineTo', 13, 16],
    ['rect', 11, 22, 3, 4],
    ['arc', 11, 22, 5, 0, 1, true],
    ['quadraticCurveTo', 11, 22, 13, 24],
    ['bezierCurveTo', 11, 22, 13, 24, 15, 26],
    ['closePath']
  ]);
  t.end();
});

tape('place rotates path points about the item position', t => {
  const {context, calls} = recorder();
  const p = place(context, 10, 20, Math.PI / 2);
  p.moveTo(1, 0);
  p.arc(1, 0, 5, 0, 1, false);
  p.ellipse(0, 0, 5, 2, 0.5, 0, 1, false);
  p.arcTo(1, 0, 0, 1, 3);
  p.rect(0, 0, 2, 1);
  t.deepEqual(round(calls), [
    ['moveTo', 10, 21],
    ['arc', 10, 21, 5, +(Math.PI / 2).toFixed(9), +(1 + Math.PI / 2).toFixed(9), false],
    ['ellipse', 10, 20, 5, 2, +(0.5 + Math.PI / 2).toFixed(9), 0, 1, false],
    ['arcTo', 10, 21, 9, 20, 3],
    ['moveTo', 10, 20],
    ['lineTo', 10, 22],
    ['lineTo', 9, 22],
    ['lineTo', 9, 20],
    ['closePath'],
    ['moveTo', 10, 20]
  ]);
  t.end();
});

// Draws each item the way the canvas renderer did before, moving the matrix.
// A rect is drawn as lines, as place draws a rotated one: node-canvas
// anti-aliases the edges of the two a little differently.
function drawTransformed(context, marktype, items) {
  const lines = new Proxy(context, {
    get: (target, key) => key === 'rect'
      ? (x, y, w, h) => {
        target.moveTo(x, y);
        target.lineTo(x + w, y);
        target.lineTo(x + w, y + h);
        target.lineTo(x, y + h);
        target.closePath();
        target.moveTo(x, y);
      }
      : typeof target[key] === 'function' ? target[key].bind(target) : target[key],
    set: (target, key, value) => (target[key] = value, true)
  });

  for (const item of items) {
    const scene = {marktype, items: [{...item, x: 0, y: 0, angle: 0}]};
    scene.items[0].mark = scene;
    context.save();
    context.translate(item.x, item.y);
    context.rotate(item.angle * Math.PI / 180);
    Marks[marktype].draw(lines, scene);
    context.restore();
  }
}

function pixels(draw) {
  const c = canvas(200, 200),
        context = c.getContext('2d');
  draw(context);
  return context.getImageData(0, 0, 200, 200).data;
}

function maxDifference(a, b) {
  let max = 0;
  for (let i = 0; i < a.length; ++i) max = Math.max(max, Math.abs(a[i] - b[i]));
  return max;
}

tape('Canvas rotated items draw as they did with a rotated matrix', t => {
  const shapes = [
    'circle', 'square', 'cross', 'diamond', 'triangle-up', 'triangle-down',
    'triangle-right', 'triangle-left', 'arrow', 'wedge', 'triangle', 'stroke',
    'M-1,-1H1V1H-1Z'
  ];
  const marks = {
    symbol: shapes.map((shape, i) => ({
      shape, size: 200, angle: 25 + 10 * i, stroke: 'black', fill: 'steelblue',
      x: 20 + 40 * (i % 4) + 0.3, y: 20 + 40 * Math.floor(i / 4) + 0.7
    })),
    arc: [{
      x: 100.4, y: 100.6, angle: 40, startAngle: 0.5, endAngle: 2.5,
      innerRadius: 10, outerRadius: 40, cornerRadius: 3, fill: 'steelblue', stroke: 'black'
    }],
    path: [{
      x: 100.4, y: 100.6, angle: 40, scaleX: 2, scaleY: 1.5,
      path: 'M-20,-10L20,-10Q30,0,20,10C10,20,-10,20,-20,10A10,10,0,0,1,-20,-10Z',
      fill: 'steelblue', stroke: 'black'
    }]
  };

  for (const marktype in marks) {
    const items = marks[marktype],
          scene = {marktype, items};
    items.forEach(item => item.mark = scene);
    const placed = pixels(context => Marks[marktype].draw(context, scene)),
          transformed = pixels(context => drawTransformed(context, marktype, items));
    t.ok(maxDifference(placed, transformed) <= 2, marktype);
  }
  t.end();
});

import tape from 'tape';
import {Marks} from '../index.js';

// A context that keeps its matrix in float32, as a browser does that hands each
// transform call on to a float32 drawing matrix (#4409). Drawing calls are no-ops.
function float32Context() {
  const f = Math.fround,
        stack = [];
  let m = [1, 0, 0, 1, 0, 0];

  function concat(a, b, c, d, e, g) {
    m = [
      f(m[0] * a + m[2] * b),
      f(m[1] * a + m[3] * b),
      f(m[0] * c + m[2] * d),
      f(m[1] * c + m[3] * d),
      f(m[0] * e + m[2] * g + m[4]),
      f(m[1] * e + m[3] * g + m[5])
    ];
  }

  const context = {
    pixelRatio: 1,
    matrix: () => m,
    setTransform(a, b, c, d, e, g) { m = [a, b, c, d, e, g].map(f); },
    translate(x, y) { concat(1, 0, 0, 1, f(x), f(y)); },
    rotate(angle) {
      const cos = f(Math.cos(angle)),
            sin = f(Math.sin(angle));
      concat(cos, sin, -sin, cos, 0, 0);
    },
    save() { stack.push(m); },
    restore() { if (stack.length) m = stack.pop(); }
  };

  return new Proxy(context, {
    get: (target, key) => key in target ? target[key] : () => {}
  });
}

function items(n, props) {
  let seed = 1;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({length: n}, () => ({
    x: random() * 500,
    y: random() * 500,
    fill: 'steelblue',
    ...props
  }));
}

function drawn(marktype, props) {
  const context = float32Context();
  const scene = {marktype, items: items(1000, props)};
  scene.items.forEach(item => item.mark = scene);
  context.setTransform(1, 0, 0, 1, 18, 11);
  Marks[marktype].draw(context, scene);
  return context.matrix();
}

tape('Canvas symbol, arc and shape items leave the matrix as they found it', t => {
  const start = [1, 0, 0, 1, 18, 11];
  t.deepEqual(drawn('symbol', {shape: 'circle', size: 25}), start, 'symbol');
  t.deepEqual(drawn('symbol', {shape: 'triangle', size: 25, angle: 30}), start, 'rotated symbol');
  t.deepEqual(drawn('arc', {outerRadius: 5, endAngle: 2}), start, 'arc');
  t.deepEqual(drawn('shape', {shape: {context: c => () => c.rect(0, 0, 2, 2)}}), start, 'shape');
  t.end();
});

tape('Canvas rotated path items leave the matrix as they found it', t => {
  const start = [1, 0, 0, 1, 18, 11];
  t.deepEqual(drawn('path', {path: 'M-2,-2L2,2', angle: 30}), start, 'rotated path');
  t.end();
});

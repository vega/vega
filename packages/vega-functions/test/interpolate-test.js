import tape from 'tape';
import { interpolateLinear } from '../index.js';

tape('interpolateLinear interpolates within array segments', t => {
  const values = [0, 10, 20];

  t.equal(interpolateLinear(values, 0), 0);
  t.equal(interpolateLinear(values, 0.25), 5);
  t.equal(interpolateLinear(values, 0.5), 10);
  t.equal(interpolateLinear(values, 0.75), 15);
  t.equal(interpolateLinear(values, 1), 20);
  t.end();
});

tape('interpolateLinear differs from lerp for non-linear control points', t => {
  // lerp would ignore the middle value and return 5 at the midpoint
  t.equal(interpolateLinear([0, 100, 10], 0.5), 100);
  t.end();
});

tape('interpolateLinear clamps out-of-range fractions', t => {
  t.equal(interpolateLinear([1, 2, 3], -1), 1);
  t.equal(interpolateLinear([1, 2, 3], 2), 3);
  t.end();
});

tape('interpolateLinear handles degenerate input', t => {
  t.equal(interpolateLinear([7], 0.5), 7);
  t.equal(interpolateLinear([], 0.5), undefined);
  t.equal(interpolateLinear(null, 0.5), undefined);
  t.end();
});

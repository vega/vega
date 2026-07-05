import tape from 'tape';
import {computeContainRect, normalizeRepeat, resolveItemPattern} from '../src/util/pattern-common.js';

tape('normalizeRepeat maps canonical repeat values', t => {
  t.deepEqual(normalizeRepeat(true), {x: true, y: true});
  t.deepEqual(normalizeRepeat('x'), {x: true, y: false});
  t.deepEqual(normalizeRepeat('y'), {x: false, y: true});
  t.deepEqual(normalizeRepeat(false), {x: false, y: false});
  t.end();
});

tape('computeContainRect centers and preserves aspect', t => {
  const r = computeContainRect(100, 50, 10, 10);
  t.ok(Math.abs(r.width - r.height) < 1e-6, 'square tile stays square');
  t.ok(r.x > 0, 'centered horizontally in wide box');
  t.end();
});

tape('resolveItemPattern marks legend swatches, passes others through', t => {
  const spec = {type: 'symbol', shape: 'M0,0', fit: undefined};
  const legendItem = {mark: {role: 'legend-symbol'}};
  const plainItem = {mark: {role: 'mark'}};
  t.equal(resolveItemPattern(legendItem, spec).fit, 'swatch');
  t.equal(resolveItemPattern(plainItem, spec), spec, 'no clone when not a swatch');
  t.end();
});

import tape from 'tape';
import {computeContainRect, normalizeRepeat, resolveItemPattern} from '../src/util/pattern-common.js';

tape('normalizeRepeat maps canonical repeat values', t => {
  t.deepEqual(normalizeRepeat(true), {x: true, y: true});
  t.deepEqual(normalizeRepeat('x'), {x: true, y: false});
  t.deepEqual(normalizeRepeat('y'), {x: false, y: true});
  t.deepEqual(normalizeRepeat(false), {x: false, y: false});
  t.end();
});

tape('computeContainRect centers and preserves aspect (wide box)', t => {
  const r = computeContainRect(100, 50, 10, 10);
  t.ok(Math.abs(r.width - r.height) < 1e-6, 'square tile stays square');
  t.ok(r.x > 0, 'centered horizontally in wide box');
  t.end();
});

tape('computeContainRect letterboxes top/bottom in a tall box', t => {
  // box (50x100) is taller relative to its width than the tile (10x10),
  // so height is constrained by width and the rect is centered vertically.
  const r = computeContainRect(50, 100, 10, 10);
  t.deepEqual(r, {x: 0, y: 25, width: 50, height: 50}, 'exact letterboxed rect');
  t.end();
});

tape('computeContainRect exact values when box and tile aspect match', t => {
  const r = computeContainRect(200, 100, 20, 10);
  t.deepEqual(r, {x: 0, y: 0, width: 200, height: 100}, 'fills the box exactly');
  t.end();
});

tape('computeContainRect pad shrinks and re-centers the rect', t => {
  const r = computeContainRect(100, 100, 10, 10, 0.9);
  t.deepEqual(r, {x: 5, y: 5, width: 90, height: 90}, 'pad applied uniformly and re-centered');
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

tape('resolveItemPattern is idempotent once fit is already swatch', t => {
  const spec = {type: 'symbol', shape: 'M0,0', fit: 'swatch'};
  const legendItem = {mark: {role: 'legend-symbol'}};
  t.equal(resolveItemPattern(legendItem, spec), spec, 'no re-clone when already swatch');
  t.end();
});

tape('resolveItemPattern forces origin:view for mark-anchored text/rule patterns', t => {
  const spec = {type: 'symbol', shape: 'M0,0', origin: 'mark'};
  const textItem = {mark: {marktype: 'text', role: 'mark'}};
  const ruleItem = {mark: {marktype: 'rule', role: 'mark'}};

  t.equal(resolveItemPattern(textItem, spec).origin, 'view', 'text marktype forces origin:view');
  t.equal(resolveItemPattern(ruleItem, spec).origin, 'view', 'rule marktype forces origin:view');
  t.end();
});

tape('resolveItemPattern leaves origin:view for text/rule untouched (no clone)', t => {
  const spec = {type: 'symbol', shape: 'M0,0', origin: 'view'};
  const textItem = {mark: {marktype: 'text', role: 'mark'}};
  t.equal(resolveItemPattern(textItem, spec), spec, 'no clone when origin is already view');
  t.end();
});

tape('resolveItemPattern leaves origin:mark alone for other marktypes', t => {
  const spec = {type: 'symbol', shape: 'M0,0', origin: 'mark'};
  const symbolItem = {mark: {marktype: 'symbol', role: 'mark'}};
  t.equal(resolveItemPattern(symbolItem, spec), spec, 'non text/rule marktypes are unaffected');
  t.end();
});

tape('resolveItemPattern composes the origin fix with the legend-swatch fix', t => {
  const spec = {type: 'symbol', shape: 'M0,0', origin: 'mark', fit: undefined};
  const legendTextItem = {mark: {marktype: 'text', role: 'legend-symbol'}};
  const out = resolveItemPattern(legendTextItem, spec);
  t.equal(out.origin, 'view', 'origin forced to view');
  t.equal(out.fit, 'swatch', 'fit forced to swatch');
  t.end();
});

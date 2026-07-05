import tape from 'tape';
import {canvas} from 'vega-canvas';
import patternFill from '../src/util/canvas/pattern.js';

const ctx = () => canvas(100, 100).getContext('2d');
const item = (extra = {}) => ({bounds: {x1: 0, y1: 0, x2: 50, y2: 50}, mark: {role: 'mark'}, ...extra});
const wrapper = () => ({pattern: {name: 'crosshatch', foreground: '#000'}});

tape('patternFill returns a CanvasPattern for a symbol pattern', t => {
  const p = patternFill({}, ctx(), item(), wrapper());
  t.ok(p, 'returns a fill style');
  t.notEqual(typeof p, 'string', 'not a plain color string');
  t.end();
});

tape('patternFill caches per wrapper object and context', t => {
  const w = wrapper(), c = ctx(), r = {};
  const p1 = patternFill(r, c, item(), w);
  const p2 = patternFill(r, c, item(), w);
  t.equal(p1, p2, 'same wrapper + context reuses CanvasPattern');
  t.end();
});

tape('patternFill does not mutate the wrapper', t => {
  const w = wrapper();
  const before = JSON.stringify(w);
  patternFill({}, ctx(), item(), w);
  t.equal(JSON.stringify(w), before, 'no state written to user spec');
  t.end();
});

tape('patternFill tolerates null renderer and bad specs', t => {
  t.equal(patternFill(null, ctx(), item(), {pattern: {name: 'zzz'}}), null, 'unknown name -> null');
  t.doesNotThrow(() => patternFill(null, ctx(), item(), wrapper()), 'null renderer ok for symbol tiles');
  t.end();
});

// count pixels with non-zero alpha in a region of a context
function ink(c2d, x, y, w, h) {
  const d = c2d.getImageData(x, y, w, h).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] > 0) ++n;
  }
  return n;
}

// first row (y) containing any non-zero alpha pixel, or -1
function firstInkRow(c2d, w, h) {
  const d = c2d.getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      if (d[(y * w + x) * 4 + 3] > 0) return y;
    }
  }
  return -1;
}

tape('patternFill positions legend swatches inside item bounds (no DOMMatrix needed)', t => {
  const c2d = ctx();
  const legendItem = {bounds: {x1: 10, y1: 10, x2: 40, y2: 40}, mark: {role: 'legend-symbol'}};
  const p = patternFill({}, c2d, legendItem, wrapper());
  t.ok(p, 'returns a fill style');

  // fill the whole canvas: with a correctly anchored no-repeat swatch,
  // ink appears only within the (padded) bounds box
  c2d.fillStyle = p;
  c2d.fillRect(0, 0, 100, 100);

  t.ok(ink(c2d, 11, 11, 28, 28) > 0, 'painted pixels inside the bounds box');
  t.equal(ink(c2d, 0, 0, 10, 10), 0, 'no pixels at the canvas origin');
  t.equal(ink(c2d, 41, 41, 59, 59), 0, 'no pixels beyond the bounds box');
  t.end();
});

tape('patternFill phase-shifts origin:mark patterns per mark anchor', t => {
  const w = {pattern: {shape: 'M0,5L10,5', tileSize: 10, stroke: '#000', strokeWidth: 2, origin: 'mark'}};
  const paint = it => {
    const c2d = ctx();
    const p = patternFill({}, c2d, it, w);
    c2d.fillStyle = p;
    c2d.fillRect(0, 0, 50, 50);
    return firstInkRow(c2d, 50, 50);
  };

  const r1 = paint({x: 0, y: 0, bounds: {x1: 0, y1: 0, x2: 50, y2: 50}, mark: {role: 'mark'}});
  const r2 = paint({x: 0, y: 3, bounds: {x1: 0, y1: 3, x2: 50, y2: 53}, mark: {role: 'mark'}});
  t.ok(r1 >= 0 && r2 >= 0, 'both anchors painted');
  t.equal(r2 - r1, 3, 'pattern phase follows the mark anchor');
  t.end();
});

tape('patternFill bounds the per-pattern tile cache', t => {
  const w = wrapper(), c = ctx(), r = {};
  const mk = s => ({bounds: {x1: 0, y1: 0, x2: s, y2: s}, mark: {role: 'legend-symbol'}});

  // swatch layouts key by box size, so distinct sizes mint distinct tiles
  const first = patternFill(r, c, mk(20), w);
  for (let s = 21; s <= 28; ++s) patternFill(r, c, mk(s), w); // 9 layouts total, cap is 8

  const firstAgain = patternFill(r, c, mk(20), w);
  t.notEqual(firstAgain, first, 'oldest entry evicted once the cap is exceeded');

  const recent = patternFill(r, c, mk(28), w);
  const recentAgain = patternFill(r, c, mk(28), w);
  t.equal(recentAgain, recent, 'entries within the cap are retained');
  t.end();
});

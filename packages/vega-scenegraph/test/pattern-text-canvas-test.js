import tape from 'tape';
import {canvas} from 'vega-canvas';

// This suite exercises the REAL marks/text.js draw() implementation (glyph
// rendering, not a stand-in). test/__init__.js -- loaded elsewhere in this
// package's combined `tape test/**/*-test.js` run -- mutates the shared
// marks/text.js default export's `draw` property in place, replacing it
// with a bounding-box stand-in for cross-platform golden-PNG stability.
// Since ES modules are singletons, importing '../src/marks/text.js'
// normally here could pick up that mutated object depending on file load
// order. A cache-busted dynamic import gets an independent module instance
// (still sharing its own dependencies, e.g. util/canvas/fill.js, with the
// rest of the suite -- only marks/text.js's own mutable export is fresh),
// so these tests are immune to that shared-state hazard either way.
const {default: Text} = await import(`../src/marks/text.js?fresh=${Date.now()}-${Math.random()}`);

const W = 260, H = 160;

function draw(items) {
  const c2d = canvas(W, H).getContext('2d');
  Text.draw.call({}, c2d, {items}, null);
  return c2d;
}

function stripeFill() {
  return {pattern: {name: 'horizontal-stripe', foreground: '#000', background: '#fff'}};
}

function ink(data) {
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) ++n;
  return n;
}

// structural translation-equivalence check: imgB(x, y) should equal
// imgA(x, y - dy), mirroring the tolerance-based comparison already used
// for phased pattern tiles in pattern-canvas-test.js.
function diffShifted(imgA, imgB, dy) {
  let maxDelta = 0, structural = 0;
  for (let y = dy; y < H; ++y) {
    for (let x = 0; x < W; ++x) {
      for (let k = 0; k < 4; ++k) {
        const a = imgA[((y - dy) * W + x) * 4 + k];
        const b = imgB[(y * W + x) * 4 + k];
        const d = Math.abs(a - b);
        if (d > maxDelta) maxDelta = d;
        if (d > 32) ++structural;
      }
    }
  }
  return {maxDelta, structural};
}

tape('pattern phase rides with the text item (mark-anchored)', t => {
  // discrimination guard: the dy between the two renders (3) must NOT be a
  // multiple of the stripe tile period (horizontal-stripe: 20px), or a
  // view-anchored pattern would coincidentally also pass the shift check.
  const base = {
    x: 10, text: 'MMM', font: 'Arial', fontSize: 40, fontWeight: 'bold',
    align: 'left', baseline: 'alphabetic', fill: stripeFill(),
    mark: {marktype: 'text', role: 'mark'}
  };

  const a = draw([{...base, y: 60}]).getImageData(0, 0, W, H).data;
  const b = draw([{...base, y: 63}]).getImageData(0, 0, W, H).data;

  t.ok(ink(a) > 0, 'first render produced ink');
  t.ok(ink(b) > 0, 'second render produced ink');

  const {structural, maxDelta} = diffShifted(a, b, 3);
  t.equal(structural, 0, `glyph + pattern shift together as one unit (max delta ${maxDelta})`);
  t.end();
});

tape('pattern frame includes dx, dy and the baseline offset (SVG transform parity)', t => {
  // SVG anchors userSpaceOnUse patterns in the <text> element's FULL
  // transform — translate(x + dx, y + dy + baselineOffset) — so two items
  // whose glyphs land on identical pixels must also paint identical
  // stripes, however that landing splits across y, dy, and baseline.
  // Discrimination guard: dy = 7 and the baseline-middle offset
  // (round(0.3 * 40) = 12) are deliberately NOT multiples of
  // horizontal-stripe's 10px ink period, so a pattern frame anchored at
  // (x, y) alone fails both comparisons.
  const base = {
    x: 10, text: 'MMM', font: 'Arial', fontSize: 40, fontWeight: 'bold',
    align: 'left', fill: stripeFill(), mark: {marktype: 'text', role: 'mark'}
  };
  const img = item => draw([item]).getImageData(0, 0, W, H).data;

  const dyA = img({...base, baseline: 'alphabetic', y: 60, dy: 7});
  const dyB = img({...base, baseline: 'alphabetic', y: 67});
  t.ok(ink(dyA) > 0, 'dy render produced ink');
  t.equal(diffShifted(dyA, dyB, 0).structural, 0,
    'PARITY: y+dy and equivalent y render identically, stripes included');

  const blA = img({...base, baseline: 'middle', y: 60});
  const blB = img({...base, baseline: 'alphabetic', y: 60 + Math.round(0.3 * 40)});
  t.ok(ink(blA) > 0, 'baseline render produced ink');
  t.equal(diffShifted(blA, blB, 0).structural, 0,
    'PARITY: the baseline offset is part of the pattern frame');
  t.end();
});

tape('patterned + rotated text: balanced save/restore, no throw, produces ink', t => {
  const c2d = canvas(W, H).getContext('2d');
  let saves = 0, restores = 0;
  const origSave = c2d.save.bind(c2d);
  const origRestore = c2d.restore.bind(c2d);
  c2d.save = () => { ++saves; origSave(); };
  c2d.restore = () => { ++restores; origRestore(); };

  const item = {
    x: 120, y: 80, text: 'MMM', font: 'Arial', fontSize: 36, angle: 30,
    fill: stripeFill(), mark: {marktype: 'text', role: 'mark'}
  };

  t.doesNotThrow(() => Text.draw.call({}, c2d, {items: [item]}, null), 'does not throw');
  t.equal(saves, restores, 'balanced save/restore calls');
  t.equal(saves, 1, 'a single combined save covers both rotate and pattern translate');
  t.ok(ink(c2d.getImageData(0, 0, W, H).data) > 0, 'ink present');
  t.end();
});

tape('multi-line patterned text renders without throw and with ink', t => {
  const item = {
    x: 10, y: 30, text: ['MMM', 'WWW'], lineHeight: 40, font: 'Arial',
    fontSize: 32, fill: stripeFill(), mark: {marktype: 'text', role: 'mark'}
  };

  let c2d;
  t.doesNotThrow(() => { c2d = draw([item]); }, 'does not throw');
  t.ok(ink(c2d.getImageData(0, 0, W, H).data) > 0, 'ink present across both lines');
  t.end();
});

tape('non-pattern text takes the pre-existing (non-translated) draw path', t => {
  // structural guard against regressions in the branch condition itself:
  // a solid, non-angled fill must not trigger the save/restore pair.
  const c2d = canvas(W, H).getContext('2d');
  let saves = 0;
  const origSave = c2d.save.bind(c2d);
  c2d.save = () => { ++saves; origSave(); };

  const item = {
    x: 10, y: 60, text: 'MMM', font: 'Arial', fontSize: 40,
    fill: 'black', mark: {marktype: 'text', role: 'mark'}
  };
  Text.draw.call({}, c2d, {items: [item]}, null);

  t.equal(saves, 0, 'no save/restore for solid, unrotated text');
  t.ok(ink(c2d.getImageData(0, 0, W, H).data) > 0, 'ink present');
  t.end();
});

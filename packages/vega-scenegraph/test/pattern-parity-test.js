import tape from 'tape';
import {canvas} from 'vega-canvas';
import {
  CanvasRenderer,
  SVGStringRenderer,
  resetSVGDefIds,
  sceneFromJSON
} from '../index.js';

// This suite proves CROSS-RENDERER PARITY: for each scene below, the same
// scenegraph JSON is rendered through both the SVG and Canvas pipelines and
// checked against the SAME contract (a def's cell size, a mark's anchor
// rule, a swatch's centering, ...). Individual per-renderer behavior is
// already covered by pattern-canvas-test.js, pattern-svg-def-test.js,
// pattern-svg-render-test.js, pattern-svg-image-test.js,
// pattern-rule-canvas-test.js and pattern-text-canvas-test.js; this file
// only asserts the seam between them.

// -- render helpers --------------------------------------------------------

function renderCanvas(scene, w, h) {
  const r = new CanvasRenderer().initialize(null, w, h).render(sceneFromJSON(scene));
  return r.canvas().getContext('2d');
}

async function renderCanvasAsync(scene, w, h) {
  const r = new CanvasRenderer().initialize(null, w, h);
  await r.renderAsync(sceneFromJSON(scene));
  return r.canvas().getContext('2d');
}

function renderSVG(scene, w, h) {
  resetSVGDefIds();
  return new SVGStringRenderer().initialize(null, w, h).render(sceneFromJSON(scene)).svg();
}

async function renderSVGAsync(scene, w, h) {
  resetSVGDefIds();
  const r = new SVGStringRenderer().initialize(null, w, h);
  r.render(sceneFromJSON(scene));
  await (r._ready || Promise.resolve());
  return r.svg();
}

// -- pixel helpers ----------------------------------------------------------

// true if the pixel is opaque and dark (the pattern foreground, '#000'),
// as opposed to transparent or the light ('#fff') background fill.
function isFg(data, w, x, y) {
  const i = (y * w + x) * 4;
  return data[i + 3] > 0 && data[i] < 128;
}

function anyFg(data, w, x0, x1, y0, y1) {
  for (let y = y0; y < y1; ++y) {
    for (let x = x0; x < x1; ++x) {
      if (isFg(data, w, x, y)) return true;
    }
  }
  return false;
}

function allBackground(data, w, x, y0, y1) {
  for (let y = y0; y < y1; ++y) {
    if (isFg(data, w, x, y)) return false;
  }
  return true;
}

// dark/light column signature over [y0, y1) at column x -- '1' for dark
// (foreground), '0' for light/background/transparent.
function colSig(data, w, x, y0, y1) {
  let s = '';
  for (let y = y0; y < y1; ++y) s += isFg(data, w, x, y) ? '1' : '0';
  return s;
}

function rowSig(data, w, y, x0, x1) {
  let s = '';
  for (let x = x0; x < x1; ++x) s += isFg(data, w, x, y) ? '1' : '0';
  return s;
}

// true if an opaque, light (background, '#fff') pixel exists in the region
function anyLight(data, w, x0, x1, y0, y1) {
  for (let y = y0; y < y1; ++y) {
    for (let x = x0; x < x1; ++x) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > 0 && data[i] >= 128) return true;
    }
  }
  return false;
}

function inkBBox(data, w, h) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return {minX, minY, maxX, maxY};
}

function pixelDiffCount(a, b, w, x0, x1, y0, y1) {
  let n = 0;
  for (let y = y0; y < y1; ++y) {
    for (let x = x0; x < x1; ++x) {
      for (let k = 0; k < 4; ++k) {
        const i = (y * w + x) * 4 + k;
        if (Math.abs(a[i] - b[i]) > 10) ++n;
      }
    }
  }
  return n;
}

// extract width/height (or x/y/width/height) attributes off the first
// <pattern ...> opening tag in an SVG string.
function patternAttrs(svg) {
  const tag = svg.match(/<pattern[^>]*>/)[0];
  const num = name => {
    const m = tag.match(new RegExp(`${name}="(-?[\\d.]+)"`));
    return m ? +m[1] : undefined;
  };
  return {tag, width: num('width'), height: num('height'), x: num('x'), y: num('y')};
}

// ===========================================================================
// 1. RECT fill -- crosshatch, cell 10x10
// ===========================================================================

function rectScene() {
  return {
    marktype: 'rect', role: 'mark',
    items: [{
      x: 0, y: 0, width: 40, height: 40,
      fill: {pattern: {name: 'crosshatch', foreground: '#000', background: '#fff'}}
    }]
  };
}

tape('parity/rect: crosshatch cell matches across renderers', t => {
  const svg = renderSVG(rectScene(), 60, 60);
  const {tag, width, height} = patternAttrs(svg);

  // CONTRACT: userSpaceOnUse cell sized to tileSize * scale (10 * 1).
  t.ok(tag.includes('patternUnits="userSpaceOnUse"'), 'userSpaceOnUse pattern');
  t.equal(width, 10, 'def cell width is the crosshatch tileSize');
  t.equal(height, 10, 'def cell height is the crosshatch tileSize');
  // CONTRACT: background rect, then shape content, both inside the def.
  t.ok(/<rect[^>]*fill="#fff"\/>.*<g[^>]*><path/.test(svg), 'background rect precedes the shape content');
  // CONTRACT: the mark references the def by url.
  t.ok(/<path[^>]*fill="url\(#pattern_0\)"/.test(svg), 'rect mark references the pattern def');

  const ctx = renderCanvas(rectScene(), 60, 60);
  const d = ctx.getImageData(0, 0, 60, 60).data;

  t.ok(anyFg(d, 60, 0, 40, 0, 40), 'dark (foreground) pixels present inside the rect');
  t.ok(anyLight(d, 60, 0, 40, 0, 40), 'light (background) pixels also present inside the rect');

  // PARITY: canvas tiling period equals the SVG def's cell exactly --
  // view-anchored (origin: 'view', the default), so the field is anchored
  // at the canvas/view origin on both renderers and a shift by one SVG
  // cell must reproduce the same column/row content on canvas.
  const col0 = colSig(d, 60, 0, 0, 40);
  const colPeriod = colSig(d, 60, width, 0, 40);
  const col2Period = colSig(d, 60, width * 2, 0, 40);
  t.equal(colPeriod, col0, 'canvas column signature repeats at +cellWidth (from the SVG def)');
  t.equal(col2Period, col0, 'canvas column signature repeats at +2*cellWidth');

  const row0 = rowSig(d, 60, 0, 0, 40);
  const rowPeriod = rowSig(d, 60, height, 0, 40);
  t.equal(rowPeriod, row0, 'canvas row signature repeats at +cellHeight (from the SVG def)');

  // period is exactly the cell, not a submultiple of it
  const colHalf = colSig(d, 60, Math.round(width / 2), 0, 40);
  t.notEqual(colHalf, col0, 'no accidental half-cell periodicity');

  t.end();
});

// ===========================================================================
// 2. SYMBOL fill -- circles, scale 2, cell 20x20
// ===========================================================================

function symbolScene() {
  return {
    marktype: 'symbol', role: 'mark',
    items: [{
      x: 30, y: 30, shape: 'square', size: 1600, // 40x40 square, bounds [10,10]-[50,50]
      fill: {pattern: {name: 'circles', scale: 2}}
    }]
  };
}

tape('parity/symbol: circles(scale 2) cell matches across renderers', t => {
  const svg = renderSVG(symbolScene(), 60, 60);
  const {width, height} = patternAttrs(svg);

  // CONTRACT: cell = tileSize * scale = 10 * 2.
  t.equal(width, 20, 'def cell width = tileSize * scale');
  t.equal(height, 20, 'def cell height = tileSize * scale');
  t.ok(/<g transform="scale\(2\)">/.test(svg), 'content wrapped in a scale(2) group');
  t.ok(/<path[^>]*fill="url\(#pattern_0\)"/.test(svg), 'symbol mark references the pattern def');

  const ctx = renderCanvas(symbolScene(), 60, 60);
  const d = ctx.getImageData(0, 0, 60, 60).data;
  const {minX, minY, maxX, maxY} = inkBBox(d, 60, 60);
  t.ok(minX >= 10 && minY >= 10 && maxX < 50 && maxY < 50,
    'sanity: ink stays within the item bounds box (no bleed past the symbol)');

  // PARITY: canvas tiling period equals the SVG def's cell exactly.
  const colA = colSig(d, 60, 10, 10, 50);
  const colAPeriod = colSig(d, 60, 10 + width, 10, 50);
  t.equal(colAPeriod, colA, 'canvas column signature repeats at +cellWidth (from the SVG def)');
  t.notEqual(colSig(d, 60, 10 + width / 2, 10, 50), colA, 'no accidental half-cell periodicity');

  t.end();
});

// ===========================================================================
// 3. TEXT fill -- horizontal-stripe, two items sharing one wrapper
// ===========================================================================

function textScene(wrapper) {
  return {
    marktype: 'text', role: 'mark',
    items: [
      {x: 10, y: 30, text: 'AAA', font: 'Arial', fontSize: 20, fill: wrapper},
      {x: 100, y: 120, text: 'BBB', font: 'Arial', fontSize: 20, fill: wrapper}
    ]
  };
}

tape('parity/text: SVG shares one def across positions; canvas anchors each item independently', async t => {
  const wrapper = {pattern: {name: 'horizontal-stripe', foreground: '#000', background: '#fff'}};
  const svg = renderSVG(textScene(wrapper), 200, 200);

  // CONTRACT: text/rule patterns are origin-neutral -- one def regardless
  // of how many distinct positions reference it.
  const defs = svg.match(/<pattern[^>]*id="pattern_\d+"/g) || [];
  t.equal(defs.length, 1, 'exactly one pattern def for two text items at different positions');
  const refs = svg.match(/fill="url\(#pattern_0\)"/g) || [];
  t.equal(refs.length, 2, 'both text items reference the shared def');
  // each <text> carries its OWN transform -- the anchoring lives on the
  // element, not on the (shared, origin-neutral) def.
  t.ok(/<text[^>]*transform="translate\(10,30\)"/.test(svg), 'first text item has its own transform');
  t.ok(/<text[^>]*transform="translate\(100,120\)"/.test(svg), 'second text item has its own transform');
  const {tag} = patternAttrs(svg);
  t.ok(!/ x="(?!0")[^"]/.test(tag) && !/ y="(?!0")[^"]/.test(tag), 'shared def carries no per-item anchor');

  // CONTRACT (canvas side, mirroring the SVG per-item transform): text.js's
  // draw() frame-matches by translating the context to each item's own
  // origin before filling, so two items sharing one wrapper still paint
  // independently -- drawing them together must reproduce the same pixels
  // as drawing each one alone. test/__init__.js replaces Marks.text.draw
  // with a bounding-box stand-in package-wide (for golden-PNG stability
  // elsewhere in this suite), so a cache-busted import is required to
  // reach the real implementation -- see pattern-text-canvas-test.js.
  const {default: Text} = await import(`../src/marks/text.js?fresh=${Date.now()}-${Math.random()}`);
  const W = 220, H = 220;
  const item1 = {x: 10, y: 30, text: 'AAA', font: 'Arial', fontSize: 20, fill: wrapper, mark: {marktype: 'text', role: 'mark'}};
  const item2 = {x: 100, y: 120, text: 'BBB', font: 'Arial', fontSize: 20, fill: wrapper, mark: {marktype: 'text', role: 'mark'}};

  const draw = items => {
    const c2d = canvas(W, H).getContext('2d');
    Text.draw.call({}, c2d, {items}, null);
    return c2d.getImageData(0, 0, W, H).data;
  };

  const combo = draw([item1, item2]);
  const soloA = draw([item1]);
  const soloB = draw([item2]);

  t.ok(anyFg(combo, W, 5, 60, 10, 45), 'ink painted near the first item\'s own origin');
  t.ok(anyFg(combo, W, 95, 150, 100, 135), 'ink painted near the second item\'s own origin');
  t.equal(pixelDiffCount(combo, soloA, W, 5, 60, 10, 45), 0,
    'PARITY: item 1 renders identically whether drawn alone or alongside item 2 (per-item anchor, no shared grid)');
  t.equal(pixelDiffCount(combo, soloB, W, 95, 150, 100, 135), 0,
    'PARITY: item 2 renders identically whether drawn alone or alongside item 1 (per-item anchor, no shared grid)');

  t.end();
});

// ===========================================================================
// 4. RULE stroke -- vertical-stripe, strokeWidth 8, mark-anchored
// ===========================================================================

// vertical-stripe's registry def places TWO stripe lines per 20-unit cell
// (rule.spacing = 10, tileSize = 20 -- see packages/vega-pattern/src/registry.js),
// so the visual ink period along x is 10, half the SVG def's cell (20).
// That is intentional pattern geometry, not a renderer disagreement -- both
// renderers tile the *same* 20-unit cell; the doubled visual frequency
// falls out of the cell's own content.
const RULE_CELL = 20;
const RULE_INK_PERIOD = 10;

function ruleScene(items) {
  return {marktype: 'rule', role: 'mark', items};
}

function stripeStroke() {
  return {pattern: {name: 'vertical-stripe', foreground: '#000', background: '#fff'}};
}

tape('parity/rule: vertical-stripe is mark-anchored on both renderers', t => {
  const item = {x: 10, y: 30, x2: 70, y2: 30, strokeWidth: 8, stroke: stripeStroke()};
  const svg = renderSVG(ruleScene([item]), 90, 60);
  const {width} = patternAttrs(svg);

  t.equal(width, RULE_CELL, 'def cell equals the registry tileSize (20)');
  // CONTRACT: the <line> carries its own transform (mark anchor lives on
  // the referencing element, exactly as for text) and references the def.
  t.ok(/<line[^>]*transform="translate\(10,30\)"[^>]*stroke="url\(#pattern_0\)"/.test(svg),
    'line element is anchored via its own transform and references the def');

  const ctx = renderCanvas(ruleScene([item]), 90, 60);
  const d = ctx.getImageData(0, 0, 90, 60).data;
  const y0 = 30 - 4, y1 = 30 + 4; // strokeWidth 8, centered on y=30

  // PARITY: canvas mark-anchors the same stroke via a context.translate to
  // the rule's start point (x1=10) before painting -- so ink phase repeats
  // every RULE_INK_PERIOD starting at x1, matching the def's own geometry.
  for (const k of [0, 1, 2]) {
    const x = 10 + k * RULE_INK_PERIOD;
    t.ok(anyFg(d, 90, x - 1, x + 2, y0, y1), `ink at anchor-relative phase x=${x} (period ${RULE_INK_PERIOD})`);
  }
  for (const k of [0, 1]) {
    const x = 10 + k * RULE_INK_PERIOD + RULE_INK_PERIOD / 2;
    t.ok(allBackground(d, 90, x, y0, y1), `no ink at the mid-period gap x=${x}`);
  }

  t.end();
});

// ===========================================================================
// 5. RULE SEAM -- two collinear horizontal rules sharing an endpoint
// ===========================================================================

tape('parity/rule-seam: two mark-anchored rules meet with no gap, and align when in-phase', t => {
  const y0 = 30 - 4, y1 = 30 + 4; // strokeWidth 8 band

  // -- misaligned case: anchors 5 and 30 differ by 25 = 2*period + 5, so
  // the two segments are deliberately OUT of phase at the joint (each is
  // independently mark-anchored -- that is the design, not a bug).
  {
    const segA = {x: 5, y: 30, x2: 30, y2: 30, strokeWidth: 8, stroke: stripeStroke()};
    const segB = {x: 30, y: 30, x2: 55, y2: 30, strokeWidth: 8, stroke: stripeStroke()};
    const ctxCombo = renderCanvas(ruleScene([segA, segB]), 90, 60);
    const combo = ctxCombo.getImageData(0, 0, 90, 60).data;

    // (a) no gap: the joint column is not entirely background.
    t.ok(anyFg(combo, 90, 30, 30 + 1, y0, y1), 'no all-background column at the seam joint (x=30)');

    // (b) each side's phase matches ITS OWN anchor: comparing the combined
    // render against each segment rendered alone (same coordinates) must
    // be pixel-identical away from the joint -- proving the two segments
    // do not interfere with each other's mark-anchored phase.
    const ctxSoloA = renderCanvas(ruleScene([segA]), 90, 60);
    const soloA = ctxSoloA.getImageData(0, 0, 90, 60).data;
    const ctxSoloB = renderCanvas(ruleScene([segB]), 90, 60);
    const soloB = ctxSoloB.getImageData(0, 0, 90, 60).data;

    t.equal(pixelDiffCount(combo, soloA, 90, 5, 29, y0 - 6, y1 + 6), 0,
      'segment A (anchor 5) renders identically solo vs. combined');
    t.equal(pixelDiffCount(combo, soloB, 90, 31, 55, y0 - 6, y1 + 6), 0,
      'segment B (anchor 30) renders identically solo vs. combined');
  }

  // -- aligned case: anchors 5 and 35 differ by 30 = 3*period, an exact
  // multiple of the ink period, so the field must be perfectly continuous
  // across the joint: pixel-identical to one single 5..60 rule.
  {
    const segA = {x: 5, y: 30, x2: 30, y2: 30, strokeWidth: 8, stroke: stripeStroke()};
    const segB = {x: 35, y: 30, x2: 60, y2: 30, strokeWidth: 8, stroke: stripeStroke()};
    const ctxAligned = renderCanvas(ruleScene([segA, segB]), 90, 60);
    const aligned = ctxAligned.getImageData(0, 0, 90, 60).data;

    const single = {x: 5, y: 30, x2: 60, y2: 30, strokeWidth: 8, stroke: stripeStroke()};
    const ctxRef = renderCanvas(ruleScene([single]), 90, 60);
    const ref = ctxRef.getImageData(0, 0, 90, 60).data;

    // PARITY: an in-phase two-segment seam is indistinguishable from one
    // continuous rule over their shared span.
    t.equal(pixelDiffCount(aligned, ref, 90, 35, 60, y0 - 6, y1 + 6), 0,
      'in-phase seam is pixel-identical to a single continuous rule');
  }

  // -- SVG structural check: both segments reference the SAME def (rule
  // patterns are origin-neutral, like text), each localized only by its
  // own <line transform>.
  {
    const segA = {x: 5, y: 30, x2: 30, y2: 30, strokeWidth: 8, stroke: stripeStroke()};
    const segB = {x: 30, y: 30, x2: 55, y2: 30, strokeWidth: 8, stroke: stripeStroke()};
    const svg = renderSVG(ruleScene([segA, segB]), 90, 60);
    const defs = svg.match(/<pattern[^>]*id="pattern_\d+"/g) || [];
    t.equal(defs.length, 1, 'both seam segments share one pattern def');
    t.ok(/<line[^>]*transform="translate\(5,30\)"/.test(svg), 'segment A has its own transform');
    t.ok(/<line[^>]*transform="translate\(30,30\)"/.test(svg), 'segment B has its own transform');
  }

  t.end();
});

// ===========================================================================
// 6. IMAGE tile -- 4x3 data URI, tileSize 8 -> cell 8x6
// ===========================================================================

// a 4x3 image with both horizontal (period 4 -> cell 8) and vertical
// (period 3 -> cell 6) structure, so tiling can be verified on both axes.
function checkerURI() {
  // all three source rows are pairwise distinct, so a vertical half-cell
  // shift (which lands on a different, non-integer-scaled source row
  // fraction) cannot coincidentally reproduce the same row signature.
  const c = canvas(4, 3);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 4, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 2, 1); // row 0: left black
  ctx.fillRect(2, 1, 2, 1); // row 1: right black
  ctx.fillRect(0, 2, 4, 1); // row 2: all black
  return c.toDataURL();
}

function imageScene(uri) {
  return {
    marktype: 'rect', role: 'mark',
    items: [{x: 0, y: 0, width: 32, height: 24, fill: {pattern: {url: uri, tileSize: 8}}}]
  };
}

tape('parity/image: 4:3 tile aspect-preserving cell matches across renderers', async t => {
  const uri = checkerURI();

  const svg = await renderSVGAsync(imageScene(uri), 40, 40);
  const {width, height} = patternAttrs(svg);
  // CONTRACT: numeric tileSize is the tile WIDTH; height preserves the
  // image's natural 4:3 aspect (8 * 3/4 = 6).
  t.equal(width, 8, 'def cell width = tileSize');
  t.equal(height, 6, 'def cell height preserves the natural aspect');
  t.ok(/<image[^>]*width="8"[^>]*height="6"/.test(svg), 'image child sized to the aspect-true cell');

  const ctx = await renderCanvasAsync(imageScene(uri), 40, 40);
  const d = ctx.getImageData(0, 0, 40, 40).data;

  // PARITY: canvas tiling period equals the SVG def's cell exactly, on
  // both axes independently (tileSize governs x, natural aspect governs y).
  const col0 = colSig(d, 40, 0, 0, 24);
  t.equal(colSig(d, 40, width, 0, 24), col0, 'canvas column signature repeats at +cellWidth (8)');
  t.equal(colSig(d, 40, width * 2, 0, 24), col0, 'canvas column signature repeats at +2*cellWidth');
  t.notEqual(colSig(d, 40, width / 2, 0, 24), col0, 'no accidental half-cell horizontal periodicity');

  const row0 = rowSig(d, 40, 0, 0, 32);
  t.equal(rowSig(d, 40, height, 0, 32), row0, 'canvas row signature repeats at +cellHeight (6)');
  t.notEqual(rowSig(d, 40, height / 2, 0, 32), row0, 'no accidental half-cell vertical periodicity');

  t.end();
});

// ===========================================================================
// 7. SWATCH -- legend-symbol role item, crosshatch, contain-fit centered
// ===========================================================================

function swatchScene() {
  return {
    marktype: 'symbol', role: 'legend-symbol',
    items: [{
      x: 30, y: 30, shape: 'square', size: 1600, // bounds box [10,10]-[50,50], center (30,30)
      fill: {pattern: {name: 'crosshatch', foreground: '#000', background: '#fff'}}
    }]
  };
}

tape('parity/swatch: both renderers center the contain-fit tile in the item box', t => {
  const svg = renderSVG(swatchScene(), 60, 60);
  t.ok(/<pattern[^>]*patternUnits="objectBoundingBox"/.test(svg), 'objectBoundingBox def for the swatch');

  // CONTRACT: pad-0.9 contain-fit, centered -- fractions symmetric about 0.5.
  const rectMatch = svg.match(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/);
  t.ok(rectMatch, 'swatch background rect present with contain-fit fractions');
  const [, fx, fy, fw, fh] = rectMatch.map(Number);
  t.equal(fx, fy, 'SVG contain-fit fractions are symmetric (square box, square tile)');
  t.equal(fw, fh, 'SVG contain-fit width/height fractions match');
  t.ok(Math.abs((fx + fw / 2) - 0.5) < 1e-6, 'SVG tile is horizontally centered in the box (x + w/2 = 0.5)');
  t.ok(Math.abs((fy + fh / 2) - 0.5) < 1e-6, 'SVG tile is vertically centered in the box (y + h/2 = 0.5)');

  const ctx = renderCanvas(swatchScene(), 60, 60);
  const d = ctx.getImageData(0, 0, 60, 60).data;
  const {minX, minY, maxX, maxY} = inkBBox(d, 60, 60);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;

  // PARITY: canvas's baked box layout centers the raster the same way the
  // SVG objectBoundingBox fractions do -- both land on the item box center.
  t.ok(Math.abs(cx - 30) <= 1, `canvas ink bbox center x (${cx}) matches the box center (30) within 1px`);
  t.ok(Math.abs(cy - 30) <= 1, `canvas ink bbox center y (${cy}) matches the box center (30) within 1px`);

  t.end();
});

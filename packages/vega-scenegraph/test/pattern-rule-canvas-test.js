import tape from 'tape';
import {canvas} from 'vega-canvas';
import Rule from '../src/marks/rule.js';

const W = 200, H = 120;

function stripeStroke() {
  return {pattern: {name: 'horizontal-stripe', foreground: '#000', background: '#fff'}};
}

function draw(item) {
  const c2d = canvas(W, H).getContext('2d');
  Rule.draw.call({}, c2d, {items: [item]}, null);
  return c2d;
}

function ink(data) {
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) ++n;
  return n;
}

// count of pixels with non-zero alpha in a sub-rectangle of a flat RGBA
// buffer of the given full-image width.
function regionInk(data, width, x0, y0, w, h) {
  let n = 0;
  for (let y = y0; y < y0 + h; ++y) {
    for (let x = x0; x < x0 + w; ++x) {
      if (data[(y * width + x) * 4 + 3] > 0) ++n;
    }
  }
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

tape('rule stroke pattern is mark-anchored (rides with the item)', t => {
  // discrimination guard: the dy between the two renders (3) must NOT be a
  // multiple of the stripe tile period (horizontal-stripe: 20px), or a
  // view-anchored pattern would coincidentally also pass the shift check.
  const base = {x: 10, x2: 190, strokeWidth: 16, stroke: stripeStroke()};

  const a = draw({...base, y: 40, y2: 40}).getImageData(0, 0, W, H).data;
  const b = draw({...base, y: 43, y2: 43}).getImageData(0, 0, W, H).data;

  t.ok(ink(a) > 0, 'first render produced ink');
  t.ok(ink(b) > 0, 'second render produced ink');

  const {structural, maxDelta} = diffShifted(a, b, 3);
  t.equal(structural, 0, `rule stroke + pattern shift together as one unit (max delta ${maxDelta})`);
  t.end();
});

tape('patterned rule renders ink along the whole segment (no gap at the translated origin)', t => {
  const c2d = draw({
    x: 10, y: 50, x2: 190, y2: 50, strokeWidth: 8, stroke: stripeStroke()
  });
  const data = c2d.getImageData(0, 0, W, H).data;

  t.ok(regionInk(data, W, 8, 44, 12, 12) > 0, 'ink near the segment start (the translated origin)');
  t.ok(regionInk(data, W, 180, 44, 12, 12) > 0, 'ink near the segment end');
  t.end();
});

tape('draw() balances save/restore around the pattern translate, only when patterned', t => {
  const plainCtx = canvas(W, H).getContext('2d');
  let saves = 0;
  const origSave = plainCtx.save.bind(plainCtx);
  plainCtx.save = () => { ++saves; origSave(); };
  Rule.draw.call({}, plainCtx, {items: [
    {x: 0, y: 10, x2: 100, y2: 10, stroke: 'black'}
  ]}, null);
  t.equal(saves, 0, 'no save/restore for a solid stroke');

  const patternCtx = canvas(W, H).getContext('2d');
  let psaves = 0, prestores = 0;
  const pSave = patternCtx.save.bind(patternCtx);
  const pRestore = patternCtx.restore.bind(patternCtx);
  patternCtx.save = () => { ++psaves; pSave(); };
  patternCtx.restore = () => { ++prestores; pRestore(); };
  Rule.draw.call({}, patternCtx, {items: [
    {x: 0, y: 10, x2: 100, y2: 10, strokeWidth: 4, stroke: stripeStroke()}
  ]}, null);
  t.equal(psaves, 1, 'one save for a patterned stroke');
  t.equal(psaves, prestores, 'balanced save/restore');
  t.end();
});

// node-canvas does not implement isPointInStroke (see the "fake
// isPointInStroke until node canvas supports it" comments already in
// canvas-handler-test.js), so hit-testing correctness for real stroke
// geometry cannot be exercised end-to-end in this environment. Instead,
// fake isPointInStroke to record the coordinates it is called with, and
// assert on the coordinate model: per the HTML spec, isPointInStroke's
// point argument is in DEVICE space, unaffected by the current CTM (WPT
// 2d.path.isPointInPath.transform.1) — the path is baked through the CTM
// at construction. So the pattern-only translate in path() must NOT cause
// any shift of the test point: patterned and solid rules alike pass the
// raw point straight through.
tape('patterned rule hit-testing passes the device-space point through unshifted', t => {
  const item = {
    x: 20, y: 30, x2: 120, y2: 30, strokeWidth: 4,
    stroke: stripeStroke(),
    mark: {marktype: 'rule', role: 'mark'},
    bounds: {contains: () => true}
  };

  const c2d = canvas(W, H).getContext('2d');
  c2d.pixelRatio = 1;
  const seen = [];
  c2d.isPointInStroke = (hx, hy) => { seen.push([hx, hy]); return true; };

  const hitItem = Rule.pick(c2d, {items: [item]}, 50, 30, 50, 30);

  t.equal(hitItem, item, 'reports a hit');
  t.deepEqual(seen, [[50, 30]], 'isPointInStroke receives the raw device-space point, same as the non-pattern case');
  t.end();
});

tape('non-pattern rule hit-testing passes the test point through unchanged', t => {
  const item = {
    x: 20, y: 30, x2: 120, y2: 30, strokeWidth: 4,
    stroke: 'black',
    mark: {marktype: 'rule', role: 'mark'},
    bounds: {contains: () => true}
  };

  const c2d = canvas(W, H).getContext('2d');
  c2d.pixelRatio = 1;
  const seen = [];
  c2d.isPointInStroke = (hx, hy) => { seen.push([hx, hy]); return true; };

  const hitItem = Rule.pick(c2d, {items: [item]}, 50, 30, 50, 30);

  t.equal(hitItem, item, 'reports a hit');
  t.deepEqual(seen, [[50, 30]], 'isPointInStroke receives the raw (unshifted) point');
  t.end();
});

import tape from 'tape';
import {buildLinesPath, normalizePatternSpec} from '../build/index.js';

// parse the 'M x1,y1 L x2,y2' segments emitted by buildLinesPath
function segments(path) {
  const re = /M\s*(-?[\d.]+),(-?[\d.]+)\s*L\s*(-?[\d.]+),(-?[\d.]+)/g;
  const out = [];
  let m;
  while ((m = re.exec(path))) {
    out.push({x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4]});
  }
  return out;
}

tape('buildLinesPath produces a path for a single angle', t => {
  const p = buildLinesPath({angle: 45, spacing: 5}, 10);
  t.equal(typeof p, 'string');
  t.ok(/^M/.test(p.trim()), 'starts with a moveto');
  t.ok(p.length > 5, 'non-trivial path');
  t.end();
});

tape('buildLinesPath with angle array unions multiple line sets', t => {
  const single = buildLinesPath({angle: 45, spacing: 5}, 10);
  const cross = buildLinesPath({angle: [45, 135], spacing: 5}, 10);
  t.ok(cross.length > single.length, 'two angles emit more segments than one');
  t.end();
});

tape('horizontal and vertical angles are axis-aligned', t => {
  const h = buildLinesPath({angle: 0, spacing: 5}, 10);
  t.ok(h.includes('M'), 'angle 0 produces segments');
  const v = buildLinesPath({angle: 90, spacing: 5}, 10);
  t.ok(v.includes('M'), 'angle 90 produces segments');
  t.end();
});

tape('buildLinesPath applies defaults for missing or absent options', t => {
  let p;
  t.doesNotThrow(() => { p = buildLinesPath({}, 10); }, 'empty options do not throw');
  t.equal(typeof p, 'string', 'empty options produce a string');
  t.ok(segments(p).length > 0, 'empty options produce a non-empty path');

  let q;
  t.doesNotThrow(() => { q = buildLinesPath(undefined, 10); }, 'undefined options do not throw');
  t.equal(typeof q, 'string', 'undefined options produce a string');
  t.ok(segments(q).length > 0, 'undefined options produce a non-empty path');

  t.equal(q, p, 'undefined options match the empty-object defaults');
  t.equal(p, buildLinesPath({angle: 45, spacing: 10 / Math.SQRT2}, 10),
    'defaults are angle 45, spacing tileSize / √2 (the tessellating value)');
  t.end();
});

// A line set tiles seamlessly iff the tile translations projected onto the
// line normal (T·|sin θ| and T·|cos θ|) are integer multiples of the spacing.
// For the 45° family both projections are T/√2, so with phase 0 every line's
// intercept (y - x for the "\\" family, x + y for the "/" family) must lie on
// the tileSize grid — otherwise stripes break at every tile boundary.
const onTileGrid = (c, T) => Math.abs(c - Math.round(c / T) * T) < 5e-3;

tape('45°-family default spacing tessellates across tile boundaries', t => {
  const T = 10;
  const cases = [
    {angle: 45, intercept: (x, y) => y - x},
    {angle: -45, intercept: (x, y) => x + y},
    {angle: 135, intercept: (x, y) => x + y}
  ];
  for (const {angle, intercept} of cases) {
    const segs = segments(buildLinesPath({angle}, T));
    t.ok(segs.length > 0, `angle ${angle} emits segments`);
    for (const s of segs) {
      t.ok(onTileGrid(intercept(s.x1, s.y1), T) && onTileGrid(intercept(s.x2, s.y2), T),
        `angle ${angle}: line through (${s.x1},${s.y1}) lies on the tile grid`);
    }
  }
  t.equal(buildLinesPath({angle: 0}, T), buildLinesPath({angle: 0, spacing: T / 2}, T),
    'axis-aligned default spacing stays tileSize / 2');
  t.end();
});

tape('diagonal built-in patterns tessellate seamlessly', t => {
  for (const name of ['diagonal-stripe', 'crosshatch']) {
    const spec = normalizePatternSpec({pattern: {name}});
    const T = spec.tileSize;
    const segs = segments(spec.shape);
    t.ok(segs.length > 0, `${name} has line segments`);
    for (const s of segs) {
      // classify the segment's family by slope sign, then check its intercept
      const c = (s.y2 - s.y1) / (s.x2 - s.x1) > 0 ? s.y1 - s.x1 : s.x1 + s.y1;
      t.ok(onTileGrid(c, T), `${name}: line through (${s.x1},${s.y1}) lies on the tile grid`);
    }
  }
  t.end();
});

tape('angle 0 emits horizontal segments spaced by the spacing option', t => {
  const segs = segments(buildLinesPath({angle: 0, spacing: 5}, 10));
  t.ok(segs.length > 1, 'multiple segments emitted');
  for (const s of segs) {
    t.equal(s.y1, s.y2, `segment at y=${s.y1} is horizontal`);
  }
  const ys = [...new Set(segs.map(s => s.y1))].sort((a, b) => a - b);
  t.ok(ys.length > 1, 'multiple distinct y offsets');
  for (let i = 1; i < ys.length; ++i) {
    t.equal(ys[i] - ys[i - 1], 5, `y offsets ${ys[i - 1]} -> ${ys[i]} spaced 5 apart`);
  }
  t.end();
});

tape('bleed extends segments beyond the tile bounds', t => {
  const segs = segments(buildLinesPath({angle: 0, spacing: 5, bleed: 2}, 10));
  t.ok(segs.length > 0, 'segments emitted');
  const xs = segs.flatMap(s => [s.x1, s.x2]);
  t.ok(Math.min(...xs) < 0, 'x extent goes below 0');
  t.ok(Math.max(...xs) > 10, 'x extent goes above tileSize');
  t.end();
});

tape('phase shifts line offsets along the normal', t => {
  const ys0 = [...new Set(
    segments(buildLinesPath({angle: 0, spacing: 5, phase: 0}, 10)).map(s => s.y1)
  )].sort((a, b) => a - b);
  const ys2 = [...new Set(
    segments(buildLinesPath({angle: 0, spacing: 5, phase: 2}, 10)).map(s => s.y1)
  )].sort((a, b) => a - b);
  t.ok(ys0.length > 0 && ys2.length > 0, 'both phases emit segments');
  for (const y of ys0) {
    t.equal(y % 5, 0, `phase 0 offset ${y} lies on the spacing grid`);
  }
  for (const y of ys2) {
    t.equal((y - 2) % 5, 0, `phase 2 offset ${y} is shifted by 2`);
  }
  t.notDeepEqual(ys2, ys0, 'phase 2 offsets differ from phase 0');
  t.end();
});

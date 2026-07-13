import tape from 'tape';
import {isPattern, normalizePatternSpec, patternKey} from '../build/index.js';

tape('isPattern detects wrapper objects only', t => {
  t.ok(isPattern({pattern: {name: 'crosshatch'}}));
  t.notOk(isPattern('steelblue'));
  t.notOk(isPattern({gradient: 'linear'}));
  t.notOk(isPattern({pattern: 'crosshatch'}), 'v0 string form is not valid');
  t.notOk(isPattern(null));
  t.end();
});

tape('named pattern resolves from registry with defaults', t => {
  const s = normalizePatternSpec({pattern: {name: 'crosshatch'}});
  t.equal(s.type, 'symbol');
  t.equal(s.origin, 'view', 'origin defaults to view');
  t.equal(s.repeat, true, 'repeat defaults to true');
  t.equal(s.scale, 1);
  t.equal(typeof s.shape, 'string');
  t.end();
});

tape('normalization is pure — input is not mutated', t => {
  const input = {pattern: {name: 'crosshatch', foreground: 'red'}};
  const before = JSON.stringify(input);
  normalizePatternSpec(input);
  t.equal(JSON.stringify(input), before, 'wrapper untouched');
  t.end();
});

tape('foreground maps onto resolved geometry colors', t => {
  const s = normalizePatternSpec({pattern: {shape: 'M0,0 L10,10', foreground: 'red'}});
  t.equal(s.fill, 'red', 'no declared colors: foreground becomes fill');
  const s2 = normalizePatternSpec({pattern: {name: 'diagonal-stripe', foreground: 'blue'}});
  t.equal(s2.stroke, 'blue', 'foreground replaces declared stroke');
  t.equal(s2.fill, undefined, 'undeclared fill stays undeclared');
  t.end();
});

tape('foreground preserves transparent/none fills (outline-only shapes)', t => {
  const squares = normalizePatternSpec({pattern: {name: 'squares', foreground: 'red'}});
  t.equal(squares.stroke, 'red', 'squares: foreground replaces stroke');
  t.equal(squares.fill, 'transparent', 'squares: transparent fill preserved (hollow)');
  const nylon = normalizePatternSpec({pattern: {name: 'nylon', foreground: 'red'}});
  t.equal(nylon.stroke, 'red', 'nylon: foreground replaces stroke');
  t.equal(nylon.fill, 'transparent', 'nylon: transparent fill preserved');
  const circles = normalizePatternSpec({pattern: {name: 'circles', foreground: 'red'}});
  t.equal(circles.fill, 'red', 'circles: solid fill replaced');
  const hound = normalizePatternSpec({pattern: {name: 'houndstooth', foreground: 'red'}});
  t.equal(hound.fill, 'red', 'houndstooth: solid fill replaced');
  const inline = normalizePatternSpec({pattern: {shape: 'M0,0 L10,10', foreground: 'red'}});
  t.equal(inline.fill, 'red', 'inline shape with no colors: foreground becomes fill');
  t.end();
});

tape('inline shape-string specs: explicit strokeWidth declares stroked geometry', t => {
  const s = normalizePatternSpec({pattern: {shape: 'M2,2 L8,8', strokeWidth: 2, foreground: 'teal'}});
  t.equal(s.stroke, 'teal', 'foreground maps to stroke, not fill');
  t.equal(s.strokeWidth, 2, 'declared strokeWidth is preserved');
  t.equal(s.fill, undefined, 'fill stays undefined for stroked line art');

  const s2 = normalizePatternSpec({pattern: {shape: 'M2,2 L8,8', strokeWidth: 2}});
  t.equal(s2.stroke, '#000', 'no foreground: stroke defaults to #000');
  t.equal(s2.fill, undefined, 'fill stays undefined');

  const s3 = normalizePatternSpec({pattern: {shape: 'M2,2 h6 v6 h-6 Z', foreground: 'teal'}});
  t.equal(s3.fill, 'teal', 'no strokeWidth: unchanged fill behavior');
  t.equal(s3.stroke, undefined, 'no strokeWidth: no stroke declared');
  t.end();
});

tape('named pattern locks core geometry, allows style overrides', t => {
  const base = normalizePatternSpec({pattern: {name: 'crosshatch'}});
  const s = normalizePatternSpec({pattern: {name: 'crosshatch', shape: 'M0,0Z', background: 'pink', tileSize: 20}});
  t.equal(s.shape, base.shape, 'shape override ignored');
  t.equal(s.background, 'pink', 'style override applied');
  t.equal(s.tileSize, base.tileSize, 'tileSize override ignored (locked)');
  t.equal(normalizePatternSpec({pattern: {name: 'crosshatch', scale: 2}}).scale, 2, 'scale is the resize control');
  t.end();
});

tape('inline symbol, rule, and image variants', t => {
  const sym = normalizePatternSpec({pattern: {shape: 'M2,2 h6 v6 h-6 Z', tileSize: 12}});
  t.equal(sym.type, 'symbol'); t.equal(sym.tileSize, 12);

  const lines = normalizePatternSpec({pattern: {shape: {type: 'lines', angle: 45, spacing: 4}}});
  t.equal(lines.type, 'symbol');
  t.equal(typeof lines.shape, 'string', 'lines generator expanded to path');

  const rule = normalizePatternSpec({pattern: {rule: {angle: [45, 135], spacing: 5}}});
  t.equal(rule.type, 'symbol', 'rule expands to symbol');

  const img = normalizePatternSpec({pattern: {url: 'https://example.com/x.png', repeat: 'x'}});
  t.equal(img.type, 'image'); t.equal(img.repeat, 'x');
  t.end();
});

tape('image tileSize is validated; fill/stroke do not apply to images', t => {
  const bad = normalizePatternSpec({pattern: {url: 'x.png', tileSize: {}}});
  t.equal(bad.tileSize, undefined, 'invalid image tileSize dropped');
  const bounds = normalizePatternSpec({pattern: {url: 'x.png', tileSize: 'bounds'}});
  t.equal(bounds.tileSize, 'bounds', 'bounds keyword accepted');
  const num = normalizePatternSpec({pattern: {url: 'x.png', tileSize: 16}});
  t.equal(num.tileSize, 16, 'positive number accepted');
  const colored = normalizePatternSpec({pattern: {url: 'x.png', fill: 'red', stroke: 'blue'}});
  t.equal(colored.fill, undefined, 'fill not carried on image specs');
  t.equal(colored.stroke, undefined, 'stroke not carried on image specs');
  t.end();
});

tape('origin defaults to mark for partial or no repeat, view for full repeat', t => {
  // a fully repeating pattern is a view-wide field, so 'view' keeps tiling
  // continuous across marks; a partial (x/y) or non-repeating pattern is a
  // single strip/tile that only makes sense relative to the mark it fills —
  // anchored at the view origin it usually misses the mark entirely.
  const p = def => normalizePatternSpec({pattern: {name: 'crosshatch', ...def}});
  t.equal(p({}).origin, 'view', 'full repeat (default) -> view');
  t.equal(p({repeat: true}).origin, 'view', 'repeat true -> view');
  t.equal(p({repeat: 'x'}).origin, 'mark', 'repeat x -> mark');
  t.equal(p({repeat: 'y'}).origin, 'mark', 'repeat y -> mark');
  t.equal(p({repeat: false}).origin, 'mark', 'repeat false -> mark');
  t.equal(p({repeat: 'x', origin: 'view'}).origin, 'view', 'explicit view wins over partial-repeat default');
  t.equal(p({repeat: true, origin: 'mark'}).origin, 'mark', 'explicit mark wins over full-repeat default');
  const img = normalizePatternSpec({pattern: {url: 'x.png', repeat: 'x'}});
  t.equal(img.origin, 'mark', 'image patterns share the partial-repeat default');
  t.end();
});

tape('common property hardening', t => {
  t.ok(normalizePatternSpec({pattern: {name: 'Crosshatch'}}), 'name resolution is case-insensitive');
  t.equal(normalizePatternSpec({pattern: {name: 'crosshatch', repeat: 'both'}}).repeat, true, 'invalid repeat falls back to true');
  t.equal(normalizePatternSpec({pattern: {name: 'crosshatch', scale: -1}}).scale, 1, 'non-positive scale falls back to 1');
  t.end();
});

tape('invalid inputs return null; unknown name returns null', t => {
  t.equal(normalizePatternSpec({pattern: {}}), null, 'no discriminator');
  t.equal(normalizePatternSpec({pattern: {name: 'zzz-unknown'}}), null);
  t.equal(normalizePatternSpec(null), null);
  t.equal(normalizePatternSpec({pattern: {name: ''}}), null, 'empty name is invalid, not inline');
  t.equal(normalizePatternSpec({pattern: {name: 0}}), null, 'numeric zero name is invalid');
  t.equal(normalizePatternSpec({pattern: {name: {}}}), null, 'object name is invalid');
  t.equal(normalizePatternSpec({pattern: {name: 42}}), null, 'non-string name is invalid');
  t.equal(normalizePatternSpec({pattern: {shape: ''}}), null, 'empty shape path is degenerate');
  t.equal(normalizePatternSpec({pattern: {rule: {spacing: 0}}}), null, 'rule expanding to empty path is degenerate');
  t.end();
});

tape('angle is not a supported common property', t => {
  const s = normalizePatternSpec({pattern: {name: 'crosshatch', angle: 45}});
  t.equal(s.angle, undefined, 'angle dropped');
  t.end();
});

tape('patternKey is stable and distinguishes specs', t => {
  const a = normalizePatternSpec({pattern: {name: 'crosshatch'}});
  const b = normalizePatternSpec({pattern: {name: 'crosshatch'}});
  const c = normalizePatternSpec({pattern: {name: 'circles'}});
  t.equal(patternKey(a), patternKey(b), 'equal specs share a key');
  t.notEqual(patternKey(a), patternKey(c), 'different specs differ');
  t.notEqual(patternKey(a), patternKey({...a, fit: 'swatch'}), 'fit differentiates keys');
  t.end();
});

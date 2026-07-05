import tape from 'tape';
import {isPattern, normalizePatternSpec, patternKey} from '../index.js';

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
  t.ok(s2.fill === 'blue' || s2.stroke === 'blue', 'foreground replaces declared color');
  t.end();
});

tape('named pattern locks core geometry, allows style overrides', t => {
  const base = normalizePatternSpec({pattern: {name: 'crosshatch'}});
  const s = normalizePatternSpec({pattern: {name: 'crosshatch', shape: 'M0,0Z', background: 'pink', tileSize: 20}});
  t.equal(s.shape, base.shape, 'shape override ignored');
  t.equal(s.background, 'pink', 'style override applied');
  t.equal(s.tileSize, 20, 'tileSize override applied');
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

tape('invalid inputs return null; unknown name returns null', t => {
  t.equal(normalizePatternSpec({pattern: {}}), null, 'no discriminator');
  t.equal(normalizePatternSpec({pattern: {name: 'zzz-unknown'}}), null);
  t.equal(normalizePatternSpec(null), null);
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
  t.end();
});

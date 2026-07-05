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

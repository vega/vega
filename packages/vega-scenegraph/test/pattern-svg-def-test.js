import tape from 'tape';
import {patternRef, resetSVGPatternId} from '../src/PatternFill.js';

tape('patternRef returns a url ref and registers a def', t => {
  resetSVGPatternId();
  const defs = {};
  const item = {mark: {role: 'mark', marktype: 'rect'}, bounds: {x1: 0, y1: 0, x2: 10, y2: 10}};
  const ref = patternRef({pattern: {name: 'crosshatch'}}, defs, '', item);
  t.equal(ref, 'url(#pattern_0)');
  t.equal(Object.keys(defs).length, 1, 'one def registered');
  t.end();
});

tape('equal specs share one def; distinct specs get distinct defs', t => {
  resetSVGPatternId();
  const defs = {};
  const item = {mark: {role: 'mark', marktype: 'rect'}, bounds: {x1: 0, y1: 0, x2: 10, y2: 10}};
  const r1 = patternRef({pattern: {name: 'crosshatch'}}, defs, '', item);
  const r2 = patternRef({pattern: {name: 'crosshatch'}}, defs, '', item);
  const r3 = patternRef({pattern: {name: 'circles'}}, defs, '', item);
  t.equal(r1, r2, 'content-equal wrappers share a def');
  t.notEqual(r1, r3);
  t.equal(Object.keys(defs).length, 2);
  t.end();
});

tape('invalid pattern returns null and registers nothing (repeatedly)', t => {
  const defs = {};
  const bad = {pattern: {name: 'zzz'}};
  t.equal(patternRef(bad, defs, '', {mark: {}}), null);
  t.equal(patternRef(bad, defs, '', {mark: {}}), null, 'cached null re-returns null');
  t.equal(Object.keys(defs).length, 0);
  t.end();
});

tape('mark-origin specs dedupe by anchor', t => {
  resetSVGPatternId();
  const defs = {};
  const at = (x, y) => ({mark: {role: 'mark', marktype: 'rect'}, x, y, bounds: {x1: x, y1: y, x2: x + 5, y2: y + 5}});
  const w = {pattern: {name: 'crosshatch', origin: 'mark'}};
  const r1 = patternRef(w, defs, '', at(0, 0));
  const r2 = patternRef(w, defs, '', at(0, 0));
  const r3 = patternRef(w, defs, '', at(20, 0));
  t.equal(r1, r2, 'same anchor shares def');
  t.notEqual(r1, r3, 'different anchor gets its own def');
  t.end();
});

tape('text/rule items are origin-neutral (no per-anchor defs)', t => {
  resetSVGPatternId();
  const defs = {};
  const at = (x, y) => ({mark: {role: 'mark', marktype: 'text'}, x, y, bounds: {x1: x, y1: y, x2: x + 5, y2: y + 5}});
  const w = {pattern: {name: 'crosshatch', origin: 'mark'}};
  const r1 = patternRef(w, defs, '', at(0, 0));
  const r2 = patternRef(w, defs, '', at(20, 30));
  t.equal(r1, r2, 'text items share one def regardless of position');
  t.end();
});

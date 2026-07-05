import tape from 'tape';
import {buildPatternDef, patternRef, resetSVGPatternId} from '../src/PatternFill.js';

// non-repeating axis extent used to emulate repeat:false/'x'/'y'
// (see NO_REPEAT_EXTENT in src/PatternFill.js)
const EXTENT = 8192;

// register a def via patternRef and return its def entry
function makeDef(wrapper, item) {
  const defs = {};
  patternRef(wrapper, defs, '', item);
  const keys = Object.keys(defs);
  if (keys.length !== 1) throw new Error('expected exactly one def');
  return defs[keys[0]];
}

const rectItem = () =>
  ({mark: {role: 'mark', marktype: 'rect'}, bounds: {x1: 0, y1: 0, x2: 10, y2: 10}});

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

// -- buildPatternDef geometry pinning ------------------------------------

tape('buildPatternDef pins the cell to tileSize * scale with a scale() content wrapper', t => {
  resetSVGPatternId();
  // crosshatch registry tileSize is 10; scale 2 -> 20-unit cell
  const def = makeDef({pattern: {name: 'crosshatch', scale: 2}}, rectItem());
  const {attrs, children} = buildPatternDef(def);

  t.equal(attrs.patternUnits, 'userSpaceOnUse');
  t.equal(attrs.width, 20, 'cell width = tileSize * scale');
  t.equal(attrs.height, 20, 'cell height = tileSize * scale');

  const g = children.find(c => c.tag === 'g');
  t.ok(g, 'content is wrapped in a <g>');
  t.equal(g.attrs.transform, 'scale(2)', 'wrapper scales tile-space content to the cell');
  t.equal(g.children.length, 1);
  t.equal(g.children[0].tag, 'path', 'shape path inside the scale wrapper');
  t.equal(typeof g.children[0].attrs.d, 'string', 'path carries the shape geometry');
  t.end();
});

tape('buildPatternDef emits the background rect first, sized to the full cell', t => {
  resetSVGPatternId();
  const def = makeDef(
    {pattern: {name: 'crosshatch', scale: 2, background: 'white'}}, rectItem());
  const {children} = buildPatternDef(def);

  t.equal(children[0].tag, 'rect', 'background rect is the first child');
  t.equal(children[0].attrs.width, 20, 'background spans the full cell width');
  t.equal(children[0].attrs.height, 20, 'background spans the full cell height');
  t.equal(children[0].attrs.fill, 'white');
  t.equal(children[1].tag, 'g', 'shape content follows the background');
  t.end();
});

tape('buildPatternDef omits the background rect for transparent backgrounds', t => {
  resetSVGPatternId();
  // registry crosshatch declares background: 'transparent'
  const def = makeDef({pattern: {name: 'crosshatch'}}, rectItem());
  const {children} = buildPatternDef(def);
  t.notOk(children.some(c => c.tag === 'rect'), 'no background rect emitted');
  t.end();
});

tape('buildPatternDef enlarges only the non-repeating axis for repeat: x', t => {
  resetSVGPatternId();
  const def = makeDef({pattern: {name: 'crosshatch', repeat: 'x'}}, rectItem());
  const {attrs} = buildPatternDef(def);
  t.equal(attrs.width, 10, 'repeating x axis keeps the cell size');
  t.equal(attrs.height, EXTENT, 'non-repeating y axis grows to the no-repeat extent');
  t.end();
});

tape('buildPatternDef enlarges both axes for repeat: false', t => {
  resetSVGPatternId();
  const def = makeDef({pattern: {name: 'crosshatch', repeat: false}}, rectItem());
  const {attrs} = buildPatternDef(def);
  t.equal(attrs.width, EXTENT);
  t.equal(attrs.height, EXTENT);
  t.end();
});

tape('different-sized legend swatches get distinct objectBoundingBox defs', t => {
  resetSVGPatternId();
  const defs = {};
  const swatch = (w, h) =>
    ({mark: {role: 'legend-symbol', marktype: 'symbol'}, bounds: {x1: 0, y1: 0, x2: w, y2: h}});
  const wrapper = {pattern: {name: 'crosshatch'}};

  const r1 = patternRef(wrapper, defs, '', swatch(16, 16));
  const r2 = patternRef(wrapper, defs, '', swatch(16, 16));
  const r3 = patternRef(wrapper, defs, '', swatch(32, 16));
  t.equal(r1, r2, 'same-size swatches share a def');
  t.notEqual(r1, r3, 'different-size swatches get distinct defs');
  t.equal(Object.keys(defs).length, 2, 'two defs registered');

  for (const key in defs) {
    const {attrs} = buildPatternDef(defs[key]);
    t.equal(attrs.patternUnits, 'objectBoundingBox');
    t.equal(attrs.patternContentUnits, 'objectBoundingBox');
    t.equal(attrs.width, 1, 'single tile spans the box');
    t.equal(attrs.height, 1, 'single tile spans the box');
  }
  t.end();
});

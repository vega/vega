import tape from 'tape';
import {buildPatternDef, patternRef, resetSVGPatternId} from '../src/PatternFill.js';

// fixed fallback extent, used only when an item has no bounds to bound
// the non-repeating axis to (see NO_REPEAT_EXTENT in src/PatternFill.js)
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

// a rect item larger than the 10-unit crosshatch tile, positioned away
// from the origin, so a bounded no-repeat extent (item bounds measured
// from the tile origin) is distinguishable from both the tile cell size
// and the fixed fallback extent. mark-origin anchor = min corner (20, 10).
const bigRect = () =>
  ({mark: {role: 'mark', marktype: 'rect'}, x: 20, y: 10, x2: 80, y2: 50,
    bounds: {x1: 20, y1: 10, x2: 80, y2: 50}});

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

tape('buildPatternDef bounds the non-repeating axis to the item for repeat: x', t => {
  resetSVGPatternId();
  // repeat:'x' defaults origin to 'mark' (anchor 20,10); non-repeating y
  // is bounded to the item extent (y2 - anchor.y = 50 - 10 = 40), NOT the
  // fixed fallback extent that browsers rasterize oversized and blur.
  const def = makeDef({pattern: {name: 'crosshatch', repeat: 'x'}}, bigRect());
  const {attrs} = buildPatternDef(def);
  t.equal(attrs.width, 10, 'repeating x axis keeps the cell size');
  t.equal(attrs.height, 40, 'non-repeating y axis is bounded to the item bounds');
  t.ok(attrs.height < EXTENT, 'not the oversized fixed extent');
  t.end();
});

tape('buildPatternDef bounds both axes to the item for repeat: false', t => {
  resetSVGPatternId();
  // anchor (20,10); extents x2-anchor.x = 60, y2-anchor.y = 40.
  const def = makeDef({pattern: {name: 'crosshatch', repeat: false}}, bigRect());
  const {attrs} = buildPatternDef(def);
  t.equal(attrs.width, 60, 'x bounded to the item extent from the tile origin');
  t.equal(attrs.height, 40, 'y bounded to the item extent from the tile origin');
  t.ok(attrs.width < EXTENT && attrs.height < EXTENT, 'not the oversized fixed extent');
  t.end();
});

tape('buildPatternDef bounds the non-repeat extent from the view origin for origin: view', t => {
  resetSVGPatternId();
  // origin:'view' tiles from (0,0), so the extent spans to the item's far
  // edge: x2 = 80, y2 = 50.
  const def = makeDef({pattern: {name: 'crosshatch', repeat: false, origin: 'view'}}, bigRect());
  const {attrs} = buildPatternDef(def);
  t.equal(attrs.x, 0, 'view-anchored tile origin');
  t.equal(attrs.y, 0);
  t.equal(attrs.width, 80, 'x spans from the view origin to the item far edge');
  t.equal(attrs.height, 50, 'y spans from the view origin to the item far edge');
  t.end();
});

tape('buildPatternDef never shrinks the non-repeat cell below one tile', t => {
  resetSVGPatternId();
  // a mark smaller than the 10-unit tile: the cell must still be a full
  // tile, or sub-tile tiling would repeat the content within the mark.
  const tiny = {mark: {role: 'mark', marktype: 'rect'}, x: 0, y: 0, x2: 4, y2: 4,
    bounds: {x1: 0, y1: 0, x2: 4, y2: 4}};
  const def = makeDef({pattern: {name: 'crosshatch', repeat: false}}, tiny);
  const {attrs} = buildPatternDef(def);
  t.equal(attrs.width, 10, 'x floored at the tile cell size');
  t.equal(attrs.height, 10, 'y floored at the tile cell size');
  t.end();
});

tape('buildPatternDef falls back to the fixed extent when item bounds are unavailable', t => {
  resetSVGPatternId();
  const noBounds = {mark: {role: 'mark', marktype: 'rect'}};
  const def = makeDef({pattern: {name: 'crosshatch', repeat: false, origin: 'view'}}, noBounds);
  const {attrs} = buildPatternDef(def);
  t.equal(attrs.width, EXTENT, 'no bounds -> fixed fallback extent');
  t.equal(attrs.height, EXTENT);
  t.end();
});

tape('non-repeat defs key by the bounded extent (same anchor, different size -> distinct defs)', t => {
  resetSVGPatternId();
  const defs = {};
  // same min corner (0,0) -> same mark anchor, but different far edges:
  // the anchor key alone would collide, so the extent must key them apart.
  const rect = (x2, y2) => ({mark: {role: 'mark', marktype: 'rect'}, x: 0, y: 0, x2, y2,
    bounds: {x1: 0, y1: 0, x2, y2}});
  const w = {pattern: {name: 'crosshatch', repeat: false}};
  const r1 = patternRef(w, defs, '', rect(60, 40));
  const r2 = patternRef(w, defs, '', rect(60, 40));
  const r3 = patternRef(w, defs, '', rect(100, 40));
  t.equal(r1, r2, 'same-size items share a non-repeat def');
  t.notEqual(r1, r3, 'different-size items get distinct non-repeat defs');
  t.equal(Object.keys(defs).length, 2, 'two defs registered');
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

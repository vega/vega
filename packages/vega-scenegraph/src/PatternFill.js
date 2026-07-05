import {normalizePatternSpec, patternKey} from 'vega-pattern';
import {computeContainRect, normalizeRepeat, resolveItemPattern} from './util/pattern-common.js';
import {domChild, domClear} from './util/dom.js';
import metadata from './util/svg/metadata.js';

const svgns = metadata.xmlns;

let pattern_id = 0;

export function resetSVGPatternId() {
  pattern_id = 0;
}

// Enlargement applied to the non-repeating axis (axes) of a pattern cell
// to emulate repeat: false / 'x' / 'y'. SVG <pattern> elements always
// tile; to suppress visible repeats along an axis we grow that axis's
// cell to a size comfortably larger than any realistic chart, so the
// next tiled copy lands outside the paintable area. This is a fixed
// constant (not derived from item bounds) so def content-keying stays
// independent of any one item's geometry -- the same wrapper spec always
// shares one def regardless of which items reference it.
const NO_REPEAT_EXTENT = 1e5;

// user-facing pattern wrapper -> normalized canonical spec (or null for
// invalid/unrecognized input). Memoized so repeated lookups against the
// same wrapper object skip re-normalizing.
const specCache = new WeakMap();

// Mark-origin anchor for non-text/rule marks: the mark's own top-left
// corner, min(x, x2) / min(y, y2), falling back to item bounds. This
// mirrors util/canvas/pattern.js's markAnchor so canvas and SVG agree on
// where a mark-anchored pattern's content originates. (text/rule marks
// are neutralized to origin:'view' by resolveItemPattern before this is
// ever consulted for them -- see util/pattern-common.js.)
function markAnchor(item) {
  const b = item && item.bounds;
  const x = !item ? 0
    : item.x != null && item.x2 != null ? Math.min(item.x, item.x2)
    : item.x != null ? item.x
    : item.x2 != null ? item.x2
    : b ? b.x1 : 0;
  const y = !item ? 0
    : item.y != null && item.y2 != null ? Math.min(item.y, item.y2)
    : item.y != null ? item.y
    : item.y2 != null ? item.y2
    : b ? b.y1 : 0;
  return {x, y};
}

function round(v) {
  return Math.round(v * 1e3) / 1e3;
}

/**
 * Resolve a fill/stroke pattern spec to a `url(#id)` reference, minting
 * (and content-keying) an SVG <pattern> def as needed. Equal canonical
 * specs share a single def; origin:'mark' specs additionally key by the
 * mark's anchor so distinct-anchored items get distinct defs.
 *
 * @param {object} value - user-facing pattern wrapper, {pattern: {...}}.
 * @param {object} defs - the renderer's pattern def registry (key -> def).
 * @param {string} base - base href to prefix the fragment reference with.
 * @param {object} item - the scenegraph item being filled/stroked.
 * @return {string|null} a url(#id) reference, or null if unresolvable.
 */
export function patternRef(value, defs, base, item) {
  let spec = specCache.has(value) ? specCache.get(value) : undefined;
  if (spec === undefined) {
    spec = normalizePatternSpec(value);
    specCache.set(value, spec);
  }
  if (!spec) return null;

  spec = resolveItemPattern(item, spec);

  let key = patternKey(spec);

  let anchor = null;
  if (spec.origin === 'mark') {
    anchor = markAnchor(item);
    key += '|@' + round(anchor.x) + ',' + round(anchor.y);
  }

  let boxWidth, boxHeight;
  if (spec.fit === 'swatch' || spec.tileSize === 'bounds') {
    const b = item && item.bounds;
    boxWidth = b ? b.x2 - b.x1 : 0;
    boxHeight = b ? b.y2 - b.y1 : 0;
    key += '|#' + round(boxWidth) + 'x' + round(boxHeight);
  }

  let def = defs[key];
  if (!def) {
    def = defs[key] = {spec, id: 'pattern_' + (pattern_id++)};
    if (anchor) {
      def.x = anchor.x;
      def.y = anchor.y;
    }
    if (boxWidth !== undefined) {
      def.boxWidth = boxWidth;
      def.boxHeight = boxHeight;
    }
  }

  return 'url(' + (base || '') + '#' + def.id + ')';
}

/**
 * Build a renderer-agnostic description of a pattern def's DOM shape:
 * {attrs, children}, children being an array of {tag, attrs, children?}
 * nodes. Both the DOM-based SVGRenderer (via updatePattern) and the
 * markup-based SVGStringRenderer (via markupPattern) render from this
 * single source of geometry, so the two renderers can never drift apart.
 *
 * @param {object} def - a pattern def entry produced by patternRef.
 * @return {object} {attrs, children}.
 */
export function buildPatternDef(def) {
  const spec = def.spec;
  return spec.fit === 'swatch' || spec.tileSize === 'bounds' ? buildSwatchDef(def)
    : spec.type === 'image' ? buildImageDef(def)
    : buildSymbolDef(def);
}

/**
 * Emit (or update) the SVG DOM for a pattern def entry produced by
 * patternRef, mirroring updateGradient's index-based domChild/domClear
 * lifecycle so unused defs are cleaned up by the caller.
 *
 * @param {SVGElement} el - the <defs> element.
 * @param {object} def - a pattern def entry, {spec, id, x?, y?, boxWidth?, boxHeight?}.
 * @param {number} index - the next free child index within el.
 * @return {number} the updated index.
 */
export function updatePattern(el, def, index) {
  const {attrs, children} = buildPatternDef(def);
  const pt = domChild(el, index++, 'pattern', svgns);
  setAttributes(pt, attrs);
  applyChildrenDOM(pt, children);
  return index;
}

function applyChildrenDOM(parent, children) {
  let i = 0;
  for (const child of children) {
    const node = domChild(parent, i++, child.tag, svgns);
    setAttributes(node, child.attrs);
    if (child.children) applyChildrenDOM(node, child.children);
    else domClear(node, 0);
  }
  domClear(parent, i);
}

/**
 * Emit a pattern def entry as markup, for the string-based SVG renderer.
 *
 * @param {object} m - a util/markup.js markup context.
 * @param {object} def - a pattern def entry, as passed to updatePattern.
 */
export function markupPattern(m, def) {
  const {attrs, children} = buildPatternDef(def);
  m.open('pattern', attrs);
  applyChildrenMarkup(m, children);
  m.close();
}

function applyChildrenMarkup(m, children) {
  for (const child of children) {
    m.open(child.tag, child.attrs);
    if (child.children) applyChildrenMarkup(m, child.children);
    m.close();
  }
}

// -- symbol (shape) tile def --------------------------------------------

// Tile cell size rule: a symbol tile cell is tileSize * scale user-space
// units (must match util/canvas/pattern.js's rasterizeSymbolTile rule).
// Content is authored in tile space (0..tileSize) and scaled up to the
// cell via a wrapping <g transform="scale(scale)">, keeping shape
// geometry identical to the registry-authored path data.
function buildSymbolDef(def) {
  const spec = def.spec;
  const scale = spec.scale || 1;
  const cell = spec.tileSize * scale;
  const rep = normalizeRepeat(spec.repeat);

  const children = [];
  if (spec.background && spec.background !== 'transparent') {
    children.push({tag: 'rect', attrs: {width: cell, height: cell, fill: spec.background}});
  }
  children.push({
    tag: 'g',
    attrs: {transform: `scale(${scale})`},
    children: [{tag: 'path', attrs: shapeAttrs(spec)}]
  });

  return {
    attrs: {
      id: def.id,
      patternUnits: 'userSpaceOnUse',
      x: def.x || 0,
      y: def.y || 0,
      width: rep.x ? cell : NO_REPEAT_EXTENT,
      height: rep.y ? cell : NO_REPEAT_EXTENT
    },
    children
  };
}

// -- image tile def -------------------------------------------------------

// A numeric tileSize sizes the image tile directly (square); an
// intrinsic (undefined) tileSize needs the image's loaded dimensions,
// which Task 17's async load/redraw flow supplies. Until then, emit the
// pattern shell without an <image> child (deferred).
function buildImageDef(def) {
  const spec = def.spec;
  const rep = normalizeRepeat(spec.repeat);
  const size = typeof spec.tileSize === 'number' ? spec.tileSize : null;

  const children = [];
  if (spec.background && spec.background !== 'transparent' && size) {
    children.push({tag: 'rect', attrs: {width: size, height: size, fill: spec.background}});
  }
  if (spec.url && size) {
    children.push({
      tag: 'image',
      attrs: {href: spec.url, preserveAspectRatio: 'none', width: size, height: size}
    });
  }

  return {
    attrs: {
      id: def.id,
      patternUnits: 'userSpaceOnUse',
      x: def.x || 0,
      y: def.y || 0,
      width: rep.x && size ? size : NO_REPEAT_EXTENT,
      height: rep.y && size ? size : NO_REPEAT_EXTENT
    },
    children
  };
}

// -- swatch / 'bounds' fit def --------------------------------------------

// Legend-swatch patterns (fit:'swatch') and 'bounds'-fit images render a
// single tile contained within the item's own bounding box, expressed in
// objectBoundingBox units so it tracks the box without per-item defs.
// Because objectBoundingBox normalizes both axes to 0..1 independently of
// the box's real aspect ratio, the tile's aspect must be pre-corrected by
// the box's real pixel dimensions before calling computeContainRect --
// see tileAspect below.
function buildSwatchDef(def) {
  const spec = def.spec;
  const boxW = def.boxWidth > 0 ? def.boxWidth : 1;
  const boxH = def.boxHeight > 0 ? def.boxHeight : 1;
  const pad = spec.fit === 'swatch' ? 0.9 : 1;

  const {w: cw, h: ch} = tileAspect(spec);
  const rect = computeContainRect(1, 1, cw / boxW, ch / boxH, pad);

  const children = [];
  if (spec.background && spec.background !== 'transparent') {
    children.push({
      tag: 'rect',
      attrs: {x: rect.x, y: rect.y, width: rect.width, height: rect.height, fill: spec.background}
    });
  }

  if (spec.type === 'image') {
    if (spec.url) {
      children.push({
        tag: 'image',
        attrs: {
          href: spec.url, preserveAspectRatio: 'none',
          x: rect.x, y: rect.y, width: rect.width, height: rect.height
        }
      });
    }
  } else {
    children.push({
      tag: 'g',
      attrs: {transform: `translate(${rect.x},${rect.y}) scale(${rect.width / spec.tileSize},${rect.height / spec.tileSize})`},
      children: [{tag: 'path', attrs: shapeAttrs(spec)}]
    });
  }

  return {
    attrs: {
      id: def.id,
      patternUnits: 'objectBoundingBox',
      patternContentUnits: 'objectBoundingBox',
      x: 0,
      y: 0,
      width: 1,
      height: 1
    },
    children
  };
}

// Real-unit tile dimensions used only to derive an aspect ratio for
// contain-fitting within a (possibly non-square) bounding box. Symbol
// tiles are square (tileSize * scale); image aspect requires the loaded
// image's intrinsic size, which Task 17 wires up asynchronously -- until
// then, images are treated as square tiles.
function tileAspect(spec) {
  const c = spec.type === 'symbol'
    ? spec.tileSize * (spec.scale || 1)
    : typeof spec.tileSize === 'number' ? spec.tileSize : 1;
  return {w: c, h: c};
}

function shapeAttrs(spec) {
  return {
    d: spec.shape,
    fill: spec.fill != null ? spec.fill : 'none',
    stroke: spec.stroke != null ? spec.stroke : 'none',
    'stroke-width': strokeWidth(spec),
    'shape-rendering': spec.shapeRendering || null
  };
}

function strokeWidth(spec) {
  if (spec.strokeWidth != null) return spec.strokeWidth;
  return spec.stroke && spec.stroke !== 'none' ? 1 : null;
}

function setAttributes(el, attrs) {
  for (const key in attrs) setAttribute(el, key, attrs[key]);
}

function setAttribute(el, name, value) {
  if (value != null) {
    el.setAttribute(name, value);
  } else {
    el.removeAttribute(name);
  }
}

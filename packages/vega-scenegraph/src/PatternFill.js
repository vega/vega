import {normalizePatternSpec, patternKey} from 'vega-pattern';
import {computeContainRect, normalizeRepeat, resolveItemPattern} from './util/pattern-common.js';
import {domChild, domClear} from './util/dom.js';
import metadata from './util/svg/metadata.js';

const svgns = metadata.xmlns;

let pattern_id = 0;

export function resetSVGPatternId() {
  pattern_id = 0;
}

// Fallback enlargement for the non-repeating axis (axes) of a pattern
// cell emulating repeat: false / 'x' / 'y'. SVG <pattern> elements always
// tile; to suppress visible repeats along an axis we grow that axis's
// cell so the next tiled copy lands outside the filled area.
//
// Normally that extent is bounded to the filled item's own bounds (see
// patternRef / noRepeatExtent), because browsers rasterize the ENTIRE
// pattern cell to an offscreen surface: an over-large cell exceeds the
// surface cap and is downsampled-then-upscaled, blurring the small tile
// content that occupies a tiny fraction of it. Bounding the cell to the
// item keeps it small enough to rasterize crisply, matching canvas's
// bounds-padding (util/canvas/pattern.js tileLayout).
//
// This constant is only the fallback for when an item exposes no bounds
// to measure against. It stays within common browser surface limits
// while exceeding realistic chart sizes; a chart larger than this along a
// non-repeating axis could show a duplicate tile copy.
const NO_REPEAT_EXTENT = 8192;

// The non-repeating-axis cell dimension for a def: the bounded extent
// stashed by patternRef (item bounds measured from the tile origin), or
// the fixed fallback when none was available, never smaller than one
// tile (a sub-tile cell would tile the content within the mark).
function noRepeatExtent(stored, tileDim) {
  const e = stored != null ? stored : NO_REPEAT_EXTENT;
  return Math.max(tileDim || 0, e);
}

// Renderer-side pattern state, keyed by the user-facing pattern wrapper
// object so nothing is ever written onto user specs (the same discipline
// as util/canvas/pattern.js's stateCache). Each entry holds:
// - spec:  the normalized canonical spec (or null for invalid input),
// - ids:   full-def-key -> assigned element id. Ids must stay stable
//          across render passes -- SVGRenderer clears its def registry on
//          every full render, and an image def emitted as a loading shell
//          must keep its id on the loaded re-render -- so id assignment
//          lives here rather than in the per-pass registry. Note that
//          this makes ids stable only for as long as the minting wrapper
//          object stays in the scene: if the wrapper leaves and a
//          content-equal one later re-enters, an equivalent def may mint
//          a fresh id. Pattern ids are an internal wiring detail between
//          a def and its url(#id) references within one document, not a
//          stable external contract.
// - image: async image-load state, {url, image|null}, requested at most
//          once per state (see getPatternImage).
const stateCache = new WeakMap();

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

// round away floating-point dust in emitted derived values
// (1e-6 is far below visual significance in any unit space used here)
function frac(v) {
  return Math.round(v * 1e6) / 1e6;
}

// Request the pattern's image through the renderer's ResourceLoader,
// mirroring marks/image.js's getImage: track the requested url in the
// wrapper's state, kick off a load, and return null until it resolves.
// Renderer#loadImage (Renderer.js#_load) captures the in-flight render
// call and re-invokes it once loading settles, so the next render pass
// re-enters patternRef with the loaded image available -- no explicit
// redraw scheduling is needed here. Requested at most once per state;
// failed loads resolve to {complete: false} and are not retried.
function getPatternImage(renderer, state) {
  const url = state.spec.url;
  const cached = state.image;
  if (cached && cached.url === url) return cached.image;

  if (renderer && renderer.loadImage) {
    const entry = state.image = {url, image: null};
    renderer.loadImage(url).then(image => {
      if (state.image === entry) entry.image = image;
    });
  }
  return null;
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
 * @param {object} [renderer] - the active renderer; supplies loadImage
 *   for image patterns, whose def geometry needs the image's natural
 *   dimensions (cell sizing, aspect-preserving heights, contain fits).
 * @return {string|null} a url(#id) reference, or null if unresolvable.
 */
export function patternRef(value, defs, base, item, renderer) {
  let state = stateCache.get(value);
  if (!state) {
    state = {spec: normalizePatternSpec(value), ids: {}, image: null};
    stateCache.set(value, state);
  }
  if (!state.spec) return null;

  const spec = resolveItemPattern(item, state.spec);

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

  // Non-repeating axes need a pattern cell just large enough to cover the
  // filled item from the tile origin, so the next tiled copy falls outside
  // the mark (one visible tile) -- bounded to the item's bounds rather than
  // a fixed oversized constant the browser would blur (see NO_REPEAT_EXTENT).
  // Folded into the key: same-anchor items of different sizes need different
  // extents, so the anchor key alone cannot dedupe them.
  let extentX, extentY;
  if (spec.fit !== 'swatch' && spec.tileSize !== 'bounds') {
    const rep = normalizeRepeat(spec.repeat);
    const b = item && item.bounds;
    if ((!rep.x || !rep.y) && b) {
      extentX = Math.max(0, Math.ceil(b.x2 - (anchor ? anchor.x : 0)));
      extentY = Math.max(0, Math.ceil(b.y2 - (anchor ? anchor.y : 0)));
      key += '|~' + extentX + 'x' + extentY;
    }
  }

  // Every image pattern needs the image's natural dimensions: intrinsic
  // tiles for both cell axes, numeric-tileSize tiles for the aspect-
  // preserving cell height, bounding-box contain fits for the natural
  // aspect. The load is requested here, during the render pass, so the
  // base Renderer's pending-load redraw can pick it up; the def key
  // already includes the url (via patternKey), so same-styled patterns
  // of different images can never share a def. Dims are NOT part of the
  // key: they derive deterministically from the url, letting the loading
  // shell and the loaded def share one key (and, via state.ids, one
  // stable id). Loads are tracked per wrapper object (not per url),
  // matching marks/image.js's per-item image tracking; content-equal
  // wrappers of the same url each request the load once, and the
  // underlying loader handles any request-level coalescing/caching.
  const img = spec.type === 'image' ? getPatternImage(renderer, state) : null;

  let def = defs[key];
  if (!def) {
    const id = state.ids[key] || (state.ids[key] = 'pattern_' + (pattern_id++));
    def = defs[key] = {spec, id};
    if (anchor) {
      def.x = anchor.x;
      def.y = anchor.y;
    }
    if (boxWidth !== undefined) {
      def.boxWidth = boxWidth;
      def.boxHeight = boxHeight;
    }
    if (extentX !== undefined) {
      def.repeatExtentX = extentX;
      def.repeatExtentY = extentY;
    }
  }

  // stash loaded image dims on the def -- including a def minted as a
  // loading shell on an earlier pass (SVGStringRenderer's def registry
  // persists across renders, so the shell def object itself is updated
  // in place on the pending-load redraw)
  if (img && img.complete !== false && (img.naturalWidth || img.width)) {
    def.imgWidth = img.naturalWidth || img.width;
    def.imgHeight = img.naturalHeight || img.height;
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
// units, the same rule as util/canvas/pattern.js's rasterizeSymbolTile.
// Content is authored in tile space (0..tileSize) and scaled up to the
// cell via a wrapping <g transform="scale(scale)">, keeping shape
// geometry identical to the registry-authored path data.
//
// Fractional-scale caveat: canvas rounds the cell to whole pixels
// (Math.round(tileSize * scale) -- rasters need integer dimensions),
// while SVG keeps the exact product (vectors don't). At e.g. scale 1.27
// on a 10-unit tile that's a 13px canvas cell vs a 12.7-unit SVG cell,
// ~0.3px of phase drift per tile between the two renderers. The outputs
// are exactly aligned whenever tileSize * scale is an integer; at
// fractional products they agree in tile content but drift slightly in
// tiling phase. This is an inherent raster-vs-vector tension, not a rule
// mismatch.
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
      width: rep.x ? cell : noRepeatExtent(def.repeatExtentX, cell),
      height: rep.y ? cell : noRepeatExtent(def.repeatExtentY, cell)
    },
    children
  };
}

// -- image tile def -------------------------------------------------------

// Image tile cell rule, converged on canvas semantics
// (util/canvas/pattern.js rasterizeImageTile): a numeric tileSize is the
// tile WIDTH, with the height preserving the image's natural aspect
// (tileSize * naturalH / naturalW); an intrinsic (undefined) tileSize
// uses the natural dimensions for both axes. Either way the cell height
// depends on the loaded image, so all image defs start as an async
// shell: correct id, best-known placeholder cell (numeric tileSize gives
// a known width and a square placeholder height; intrinsic knows
// neither), background painted immediately as a loading placeholder, no
// <image> child yet -- the pending-load redraw fills the dims in
// (patternRef stashes them on the def as imgWidth/imgHeight).
//
// The <image> child keeps preserveAspectRatio 'none': the cell matches
// the image's natural aspect by construction, so 'none' is a no-op that
// also guards against letterboxing from sub-pixel rounding of the
// derived cell height.
function buildImageDef(def) {
  const spec = def.spec;
  const rep = normalizeRepeat(spec.repeat);
  const size = typeof spec.tileSize === 'number' ? spec.tileSize : null;
  const dims = def.imgWidth > 0 && def.imgHeight > 0;
  const w = size != null ? size : dims ? def.imgWidth : null;
  const h = dims
    ? (size != null ? frac(size * def.imgHeight / def.imgWidth) : def.imgHeight)
    : size; // placeholder height (square) until the aspect loads; null if intrinsic

  const children = [];
  if (spec.background && spec.background !== 'transparent') {
    // span the tile cell once dims are known; until then span the
    // best-known placeholder cell so the background paints immediately
    children.push({tag: 'rect', attrs: {
      width: w != null ? w : NO_REPEAT_EXTENT,
      height: h != null ? h : NO_REPEAT_EXTENT,
      fill: spec.background
    }});
  }
  if (spec.url && dims) {
    children.push({
      tag: 'image',
      attrs: {href: spec.url, preserveAspectRatio: 'none', width: w, height: h}
    });
  }

  return {
    attrs: {
      id: def.id,
      patternUnits: 'userSpaceOnUse',
      x: def.x || 0,
      y: def.y || 0,
      width: rep.x && w != null ? w : noRepeatExtent(def.repeatExtentX, w),
      height: rep.y && h != null ? h : noRepeatExtent(def.repeatExtentY, h)
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

  const {w: cw, h: ch} = tileAspect(def);
  const fit = computeContainRect(1, 1, cw / boxW, ch / boxH, pad);

  // round away floating-point dust in the emitted 0..1 fractions
  const rect = {x: frac(fit.x), y: frac(fit.y), width: frac(fit.width), height: frac(fit.height)};

  const children = [];
  if (spec.background && spec.background !== 'transparent') {
    children.push({
      tag: 'rect',
      attrs: {x: rect.x, y: rect.y, width: rect.width, height: rect.height, fill: spec.background}
    });
  }

  if (spec.type === 'image') {
    // the contain fit needs the image's natural aspect (matching canvas's
    // box layout), so the <image> child is deferred until the async load
    // resolves; the background above paints immediately as a placeholder
    if (spec.url && def.imgWidth > 0 && def.imgHeight > 0) {
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
// tiles are square (tileSize * scale); images use their natural
// dimensions once the async load resolves (matching canvas's box
// layout), with a square placeholder while loading -- the <image> child
// itself is deferred until the aspect is known, so the placeholder only
// affects the interim background rect.
function tileAspect(def) {
  const spec = def.spec;
  if (spec.type === 'image') {
    return def.imgWidth > 0 && def.imgHeight > 0
      ? {w: def.imgWidth, h: def.imgHeight}
      : {w: 1, h: 1};
  }
  const c = spec.tileSize * (spec.scale || 1);
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

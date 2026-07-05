import {canvas} from 'vega-canvas';
import {normalizePatternSpec, patternKey} from 'vega-pattern';
import {computeContainRect, normalizeRepeat, resolveItemPattern} from '../pattern-common.js';
import pathParse from '../../path/parse.js';
import pathRender from '../../path/render.js';

// Renderer-side pattern state, keyed by the user-facing pattern wrapper
// object so nothing is ever written onto user specs. Each entry holds the
// normalized (renderer-agnostic) spec plus a cache of rasterized tiles,
// keyed by patternKey(spec), one CanvasPattern per (spec, context) pair.
const stateCache = new WeakMap();

/**
 * Resolve a fill/stroke pattern spec into a CanvasPattern, rasterizing
 * (and caching) the tile as needed. Returns null when the pattern cannot
 * yet be resolved (invalid spec, image still loading, unsupported canvas
 * capability), in which case callers should fall back to 'transparent'.
 *
 * @param {object} renderer - the active renderer, used to load pattern
 *   images via renderer.loadImage. May be null for symbol-only patterns.
 * @param {CanvasRenderingContext2D} context - the destination context.
 * @param {object} item - the scenegraph item being filled/stroked.
 * @param {object} value - the user-facing pattern wrapper, {pattern: {...}}.
 * @return {CanvasPattern|null}
 */
export default function patternFill(renderer, context, item, value) {
  if (!context || !context.createPattern) return null;

  let state = stateCache.get(value);
  if (!state) {
    const spec = normalizePatternSpec(value);
    if (!spec) return null;
    state = {spec, image: null, tiles: new Map()};
    stateCache.set(value, state);
  }

  const spec = resolveItemPattern(item, state.spec);
  // 'bounds'-fit image tiles are rasterized to the requesting item's box
  // size, so fold that size into the cache key. This is a deliberate
  // simplification: distinct items sharing one pattern value and a
  // 'bounds' tileSize each get their own correctly-sized tile, but the
  // tile is not shared across differently-sized boxes.
  const key = patternKey(spec) + boundsSuffix(spec, item);

  let entry = state.tiles.get(key);
  if (!entry || entry.context !== context) {
    let tile;
    try {
      tile = rasterizeTile(renderer, spec, item, state);
    } catch (e) {
      return null; // malformed geometry, etc.
    }
    if (!tile) return null; // e.g., image not loaded yet

    let canvasPattern;
    try {
      canvasPattern = context.createPattern(tile.canvas, repeatMode(spec));
    } catch (e) {
      canvasPattern = null;
    }
    if (!canvasPattern) return null;

    entry = {canvasPattern, context, width: tile.width, height: tile.height};
    state.tiles.set(key, entry);
  }

  applyTransform(entry.canvasPattern, spec, item, entry.width, entry.height);
  return entry.canvasPattern;
}

function boundsSuffix(spec, item) {
  if (spec.tileSize !== 'bounds' || !item || !item.bounds) return '';
  const w = Math.round(item.bounds.x2 - item.bounds.x1);
  const h = Math.round(item.bounds.y2 - item.bounds.y1);
  return `|${w}x${h}`;
}

function repeatMode(spec) {
  // Single contain-fit tiles (legend swatches, 'bounds'-fit images) are
  // always drawn once, regardless of the spec's own repeat setting.
  if (spec.fit === 'swatch' || spec.tileSize === 'bounds') return 'no-repeat';
  const r = normalizeRepeat(spec.repeat);
  return r.x && r.y ? 'repeat' : r.x ? 'repeat-x' : r.y ? 'repeat-y' : 'no-repeat';
}

function rasterizeTile(renderer, spec, item, state) {
  return spec.type === 'image'
    ? rasterizeImageTile(renderer, spec, item, state)
    : rasterizeSymbolTile(spec);
}

// -- symbol tiles --------------------------------------------------------

// Tile cell size rule: a symbol tile is rasterized at
// tileSize * scale pixels (scale is baked into the raster for crisp
// output at high scale factors, rather than applied via pattern
// transform). The SVG task's pattern element must use the same rule
// (tile cell size = tileSize * scale) so canvas and SVG output match.
function rasterizeSymbolTile(spec) {
  const s = spec.scale || 1;
  const cell = Math.max(1, Math.round(spec.tileSize * s));
  const tile = canvas(cell, cell);
  const tctx = tile.getContext('2d');

  if (spec.background && spec.background !== 'transparent') {
    tctx.fillStyle = spec.background;
    tctx.fillRect(0, 0, cell, cell);
  }

  const fill = spec.fill;
  const stroke = spec.stroke;
  const strokeWidth = spec.strokeWidth != null ? spec.strokeWidth : (stroke ? 1 : 0);

  tctx.save();
  tctx.scale(s, s);

  let path = null;
  if (typeof Path2D !== 'undefined') {
    try { path = new Path2D(spec.shape); } catch (e) { path = null; }
  }
  if (!path) {
    // node-canvas (and other environments without Path2D) fall back to
    // vega-scenegraph's own SVG path parser/renderer.
    pathRender(tctx, pathParse(spec.shape));
  }

  if (fill && fill !== 'none') {
    tctx.fillStyle = fill;
    path ? tctx.fill(path) : tctx.fill();
  }
  if (stroke && stroke !== 'none' && strokeWidth) {
    tctx.strokeStyle = stroke;
    tctx.lineWidth = strokeWidth;
    path ? tctx.stroke(path) : tctx.stroke();
  }

  tctx.restore();
  return {canvas: tile, width: cell, height: cell};
}

// -- image tiles -----------------------------------------------------------

function getPatternImage(renderer, spec, state) {
  const cached = state.image;
  if (cached && cached.url === spec.url) return cached.image;

  // Mirror marks/image.js's getImage: track the requested url, kick off a
  // load, and return null until it resolves. The Renderer itself schedules
  // a re-render once the image finishes loading (see ResourceLoader /
  // Renderer#_load), so no explicit redraw call is needed here. State is
  // held on our own WeakMap entry, never on the user's pattern spec.
  state.image = {url: spec.url, image: null};
  if (renderer && renderer.loadImage) {
    renderer.loadImage(spec.url).then(image => {
      if (state.image && state.image.url === spec.url) {
        state.image = {url: spec.url, image};
      }
    });
  }
  return null;
}

function rasterizeImageTile(renderer, spec, item, state) {
  if (!spec.url) return null;
  const img = getPatternImage(renderer, spec, state);
  if (!img || (img.complete === false)) return null;

  const naturalW = img.naturalWidth || img.width || 1;
  const naturalH = img.naturalHeight || img.height || 1;
  const aspect = naturalW / naturalH || 1;

  let w, h, dx = 0, dy = 0, dw, dh;

  if (spec.tileSize === 'bounds' && item && item.bounds) {
    // Contain-fit the image into the requesting item's box, once,
    // no-repeat. Full objectBoundingBox-style fitting is SVG/swatch
    // territory (see resolveItemPattern); this canvas path keeps things
    // simple: one raster per (spec, item box size).
    w = Math.max(1, Math.round(item.bounds.x2 - item.bounds.x1));
    h = Math.max(1, Math.round(item.bounds.y2 - item.bounds.y1));
    const rect = computeContainRect(w, h, naturalW, naturalH, 1);
    dx = rect.x; dy = rect.y; dw = rect.width; dh = rect.height;
  } else if (typeof spec.tileSize === 'number') {
    // A single tileSize number implies a tile that keeps the image's own
    // aspect ratio (width = tileSize, height = tileSize / aspect), so
    // drawing "stretched" to fill that tile does not distort the image.
    w = Math.max(1, Math.round(spec.tileSize));
    h = Math.max(1, Math.round(spec.tileSize / aspect));
    dw = w; dh = h;
  } else {
    // undefined tileSize -> intrinsic image size
    w = Math.max(1, Math.round(naturalW));
    h = Math.max(1, Math.round(naturalH));
    dw = w; dh = h;
  }

  const tile = canvas(w, h);
  const tctx = tile.getContext('2d');
  if (spec.background && spec.background !== 'transparent') {
    tctx.fillStyle = spec.background;
    tctx.fillRect(0, 0, w, h);
  }
  tctx.drawImage(img, dx, dy, dw, dh);
  return {canvas: tile, width: w, height: h};
}

// -- pattern transform -----------------------------------------------------

function applyTransform(canvasPattern, spec, item, cellWidth, cellHeight) {
  // Capability guard: some canvas environments (older node-canvas builds,
  // certain headless setups) expose createPattern without a working
  // setTransform/DOMMatrix pair. Rather than throw, skip transforming the
  // pattern: origin:'view' (the default) is an identity transform anyway,
  // so only mark-anchored, swatch-fit, and bounds-fit patterns lose their
  // positioning in that environment.
  if (!canvasPattern || !canvasPattern.setTransform || typeof DOMMatrix === 'undefined') return;

  const m = new DOMMatrix();

  if (spec.fit === 'swatch' && item && item.bounds) {
    // Contain-fit the single rasterized tile into the legend swatch box.
    const boxW = item.bounds.x2 - item.bounds.x1;
    const boxH = item.bounds.y2 - item.bounds.y1;
    const rect = computeContainRect(boxW, boxH, cellWidth, cellHeight, 0.9);
    const sx = cellWidth ? rect.width / cellWidth : 1;
    const sy = cellHeight ? rect.height / cellHeight : 1;
    m.translateSelf(item.bounds.x1 + rect.x, item.bounds.y1 + rect.y);
    m.scaleSelf(sx, sy);
  } else if (spec.tileSize === 'bounds' && item && item.bounds) {
    // The tile was rasterized to exactly fill item.bounds; anchor its
    // origin there.
    m.translateSelf(item.bounds.x1, item.bounds.y1);
  } else if (spec.origin === 'mark' && item) {
    // Anchor the (repeating) pattern's phase to the mark's own top-left
    // corner rather than the view. This anchor rule must match the SVG
    // task's pattern x/y positioning for origin:'mark'.
    const mx = item.x != null && item.x2 != null ? Math.min(item.x, item.x2)
      : item.x != null ? item.x
      : item.x2 != null ? item.x2
      : item.bounds ? item.bounds.x1 : 0;
    const my = item.y != null && item.y2 != null ? Math.min(item.y, item.y2)
      : item.y != null ? item.y
      : item.y2 != null ? item.y2
      : item.bounds ? item.bounds.y1 : 0;
    m.translateSelf(mx, my);
  }
  // origin === 'view' (the default): identity, no translation.

  canvasPattern.setTransform(m);
}

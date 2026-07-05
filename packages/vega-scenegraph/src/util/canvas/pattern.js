import {canvas} from 'vega-canvas';
import {normalizePatternSpec, patternKey} from 'vega-pattern';
import {computeContainRect, normalizeRepeat, resolveItemPattern} from '../pattern-common.js';
import pathParse from '../../path/parse.js';
import pathRender from '../../path/render.js';

// Renderer-side pattern state, keyed by the user-facing pattern wrapper
// object so nothing is ever written onto user specs. Each entry holds the
// normalized (renderer-agnostic) spec plus a cache of rasterized tiles,
// keyed by patternKey(spec) + layout, one CanvasPattern per (spec, layout,
// context) triple.
const stateCache = new WeakMap();

// Per-pattern tile cache bound. Layout-dependent tiles (mark-anchored
// phases, swatch/'bounds' box sizes) mint one raster per distinct layout;
// a continuously-resizing item would otherwise accumulate canvases without
// limit. Eviction is oldest-inserted (FIFO), which is sufficient here: the
// common steady state is a handful of layouts reused across renders.
const MAX_TILES = 8;

// Positioning strategy: ALL pattern positioning (mark-origin phase,
// legend-swatch fit, 'bounds' image fit) is baked into the rasterized
// tile itself rather than applied via CanvasPattern.setTransform. Node
// has no global DOMMatrix (and node-canvas requires a real DOMMatrix
// instance for pattern.setTransform), so a transform-based path would
// silently no-op positioning on every server-side render. Baking keeps a
// single code path with identical output in browser and Node. The cost:
// anchored (no-repeat) tiles far from the canvas origin rasterize a
// canvas spanning from the origin to the tile, and each distinct
// phase/box layout is a separate raster — both bounded by MAX_TILES.

/**
 * Resolve a fill/stroke pattern spec into a CanvasPattern, rasterizing
 * (and caching) the tile as needed. Returns null when the pattern cannot
 * yet be resolved (invalid spec, image still loading, rasterization
 * failure), in which case callers should fall back to 'transparent'.
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
  const layout = tileLayout(spec, item);
  const key = patternKey(spec) + layout.key;

  let entry = state.tiles.get(key);
  if (!entry || entry.context !== context) {
    let tile;
    try {
      tile = rasterizeTile(renderer, spec, state, layout);
    } catch (e) {
      return null; // malformed geometry, etc.
    }
    if (!tile) return null; // e.g., image not loaded yet

    let canvasPattern;
    try {
      canvasPattern = context.createPattern(tile, layout.mode);
    } catch (e) {
      canvasPattern = null;
    }
    if (!canvasPattern) return null;

    entry = {canvasPattern, context};
    state.tiles.delete(key); // refresh insertion order when replacing
    state.tiles.set(key, entry);
    if (state.tiles.size > MAX_TILES) {
      state.tiles.delete(state.tiles.keys().next().value);
    }
  }

  return entry.canvasPattern;
}

const mod = (v, m) => ((v % m) + m) % m;

// Anchor rule for origin:'mark': the mark's own top-left corner,
// min(x, x2) / min(y, y2), falling back to item bounds. This anchor rule
// must match the SVG task's pattern x/y positioning for origin:'mark'.
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
  return [x, y];
}

/**
 * Compute how a pattern tile is positioned for a given item:
 * - 'box': a single contain-fit tile inside the item's bounds box
 *   (legend swatches at pad 0.9, 'bounds'-fit images at pad 1),
 *   always no-repeat.
 * - 'tile': a repeating (or single view/mark-anchored) cell tile;
 *   origin:'mark' contributes a phase, wrapped to the cell size along
 *   repeating axes so items sharing a phase share a raster.
 * The layout's key slice is folded into the tile cache key.
 */
function tileLayout(spec, item) {
  const b = item && item.bounds;

  if ((spec.fit === 'swatch' || spec.tileSize === 'bounds') && b) {
    const pad = spec.fit === 'swatch' ? 0.9 : 1;
    const w = Math.max(1, b.x2 - b.x1);
    const h = Math.max(1, b.y2 - b.y1);
    return {
      kind: 'box', mode: 'no-repeat', pad,
      x: b.x1, y: b.y1, w, h,
      key: `|box:${Math.round(b.x1)},${Math.round(b.y1)},${Math.round(w)}x${Math.round(h)}:${pad}`
    };
  }

  const r = normalizeRepeat(spec.repeat);
  const mode = r.x && r.y ? 'repeat' : r.x ? 'repeat-x' : r.y ? 'repeat-y' : 'no-repeat';
  const [mx, my] = spec.origin === 'mark' ? markAnchor(item) : [0, 0];

  // Symbol tiles are square with a known cell size, so the anchor can be
  // wrapped to a phase up front and items sharing a phase share a raster.
  // Image cell sizes may depend on the loaded image's aspect ratio, so
  // their anchor is wrapped at raster time and the raw anchor keys the
  // cache instead (more cache entries, still correct).
  const cell = spec.type === 'symbol'
    ? Math.max(1, Math.round(spec.tileSize * (spec.scale || 1)))
    : 0;
  const x = r.x && cell ? mod(mx, cell) : mx;
  const y = r.y && cell ? mod(my, cell) : my;

  return {
    kind: 'tile', mode, repX: r.x, repY: r.y, x, y,
    key: `|tile:${mode}:${Math.round(x)},${Math.round(y)}`
  };
}

function rasterizeTile(renderer, spec, state, layout) {
  return spec.type === 'image'
    ? rasterizeImageTile(renderer, spec, state, layout)
    : rasterizeSymbolTile(spec, layout);
}

function fillBackground(tctx, spec, x, y, w, h) {
  if (spec.background && spec.background !== 'transparent') {
    tctx.fillStyle = spec.background;
    tctx.fillRect(x, y, w, h);
  }
}

// Clip drawing to the tile cell rect. Pattern geometry may intentionally
// bleed past the cell (e.g. generated line patterns bleed 1 unit to stay
// seamless); on a cell-sized canvas the canvas edge clips that bleed, but
// box/anchored rasters are larger than the cell, so clip explicitly.
function clipCell(tctx, x, y, w, h) {
  tctx.beginPath();
  tctx.rect(x, y, w, h);
  tctx.clip();
}

// -- symbol tiles ------------------------------------------------------

// Draw the spec's shape into a tile context at the given offset and
// scale, via Path2D when available, else vega-scenegraph's own SVG path
// parser/renderer (node-canvas and other environments lack Path2D).
function drawShape(tctx, spec, ox, oy, scale) {
  tctx.save();
  tctx.translate(ox, oy);
  tctx.scale(scale, scale);

  let path = null;
  if (typeof Path2D !== 'undefined') {
    try { path = new Path2D(spec.shape); } catch (e) { path = null; }
  }
  if (!path) {
    pathRender(tctx, pathParse(spec.shape));
  }

  const fill = spec.fill;
  const stroke = spec.stroke;
  const strokeWidth = spec.strokeWidth != null ? spec.strokeWidth : (stroke ? 1 : 0);

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
}

// Tile cell size rule: a symbol tile cell is tileSize * scale pixels
// (scale is baked into the raster for crisp output at high scale factors,
// rather than applied via pattern transform). The SVG task's pattern
// element must use the same rule (tile cell size = tileSize * scale) so
// canvas and SVG output match.
function rasterizeSymbolTile(spec, layout) {
  const s = spec.scale || 1;
  const cell = Math.max(1, Math.round(spec.tileSize * s));

  if (layout.kind === 'box') {
    // single tile contain-fit into the item's bounds box, with the box
    // anchor baked into the raster (pattern space is canvas space, so the
    // raster spans from the canvas origin to the fitted tile).
    const rect = computeContainRect(layout.w, layout.h, cell, cell, layout.pad);
    const x0 = layout.x + rect.x, y0 = layout.y + rect.y;
    const tile = canvas(
      Math.max(1, Math.ceil(x0 + rect.width)),
      Math.max(1, Math.ceil(y0 + rect.height))
    );
    const tctx = tile.getContext('2d');
    fillBackground(tctx, spec, x0, y0, rect.width, rect.height);
    tctx.save();
    clipCell(tctx, x0, y0, rect.width, rect.height);
    drawShape(tctx, spec, x0, y0, s * (rect.width / cell));
    tctx.restore();
    return tile;
  }

  // cell tile; along repeating axes a mark-origin anchor becomes a phase
  // shift of the tile content, drawn with a wrapped extra copy so the
  // tile stays seamless; along non-repeating axes the anchor is baked by
  // extending the raster from the canvas origin to the tile.
  const W = layout.repX ? cell : Math.max(1, Math.ceil(layout.x + cell));
  const H = layout.repY ? cell : Math.max(1, Math.ceil(layout.y + cell));
  const ox = layout.repX ? mod(layout.x, cell) : layout.x;
  const oy = layout.repY ? mod(layout.y, cell) : layout.y;

  const tile = canvas(W, H);
  const tctx = tile.getContext('2d');
  fillBackground(tctx, spec, layout.repX ? 0 : ox, layout.repY ? 0 : oy, cell, cell);
  tctx.save();
  clipCell(tctx, layout.repX ? 0 : ox, layout.repY ? 0 : oy, cell, cell);

  const xs = layout.repX && ox ? [ox, ox - cell] : [ox];
  const ys = layout.repY && oy ? [oy, oy - cell] : [oy];
  for (const x of xs) {
    for (const y of ys) {
      drawShape(tctx, spec, x, y, s);
    }
  }
  tctx.restore();
  return tile;
}

// -- image tiles ---------------------------------------------------------

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

function rasterizeImageTile(renderer, spec, state, layout) {
  if (!spec.url) return null;
  const img = getPatternImage(renderer, spec, state);
  if (!img || img.complete === false) return null;

  const naturalW = img.naturalWidth || img.width || 1;
  const naturalH = img.naturalHeight || img.height || 1;

  if (layout.kind === 'box') {
    // contain-fit into the item's bounds box (legend swatch at pad 0.9,
    // 'bounds' tileSize at pad 1), anchor baked into the raster.
    const rect = computeContainRect(layout.w, layout.h, naturalW, naturalH, layout.pad);
    const x0 = layout.x + rect.x, y0 = layout.y + rect.y;
    const tile = canvas(
      Math.max(1, Math.ceil(x0 + rect.width)),
      Math.max(1, Math.ceil(y0 + rect.height))
    );
    const tctx = tile.getContext('2d');
    fillBackground(tctx, spec, x0, y0, rect.width, rect.height);
    tctx.drawImage(img, x0, y0, rect.width, rect.height);
    return tile;
  }

  // A single tileSize number implies a tile that keeps the image's own
  // aspect ratio (width = tileSize, height = tileSize / aspect); an
  // undefined tileSize uses the image's intrinsic size.
  const w = typeof spec.tileSize === 'number'
    ? Math.max(1, Math.round(spec.tileSize))
    : Math.max(1, Math.round(naturalW));
  const h = typeof spec.tileSize === 'number'
    ? Math.max(1, Math.round(spec.tileSize * naturalH / naturalW))
    : Math.max(1, Math.round(naturalH));

  const W = layout.repX ? w : Math.max(1, Math.ceil(layout.x + w));
  const H = layout.repY ? h : Math.max(1, Math.ceil(layout.y + h));
  const ox = layout.repX ? mod(layout.x, w) : layout.x;
  const oy = layout.repY ? mod(layout.y, h) : layout.y;

  const tile = canvas(W, H);
  const tctx = tile.getContext('2d');
  fillBackground(tctx, spec, layout.repX ? 0 : ox, layout.repY ? 0 : oy, w, h);

  const xs = layout.repX && ox ? [ox, ox - w] : [ox];
  const ys = layout.repY && oy ? [oy, oy - h] : [oy];
  for (const x of xs) {
    for (const y of ys) {
      tctx.drawImage(img, x, y, w, h);
    }
  }
  return tile;
}

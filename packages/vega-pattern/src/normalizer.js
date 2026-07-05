import {pattern as getPattern} from './patterns.js';
import {buildLinesPath} from './lines.js';

// core geometry keys: locked once a named pattern is resolved from the
// registry, since they define the tile-space drawing and must stay
// consistent with the shape actually generated for that name. tileSize
// is locked too — geometry is authored against it at registration time;
// use `scale` to resize a named pattern instead.
const CORE_KEYS = ['shape', 'url', 'rule', 'image', 'tileSize'];
const REPEATS = [true, false, 'x', 'y'];

/**
 * Detect the user-facing pattern wrapper object, {pattern: {...}}.
 * The legacy v0 string shorthand ({pattern: 'crosshatch'}) is not valid.
 */
export function isPattern(value) {
  return !!(value && typeof value === 'object' &&
    value.pattern && typeof value.pattern === 'object');
}

function isLinesShape(shape) {
  return !!(shape && typeof shape === 'object' && shape.type === 'lines');
}

/**
 * Normalize a user-facing pattern wrapper object into a canonical,
 * fully-resolved internal pattern spec. Pure: never mutates the input.
 * Returns null for invalid or unrecognized input.
 *
 * @param {object} input - a value that may be a pattern wrapper,
 *   {pattern: {...}}.
 * @return {object|null} the normalized spec, or null.
 */
export function normalizePatternSpec(input) {
  if (!isPattern(input)) return null;
  const def = input.pattern;

  // Resolve the pattern definition. A named pattern's core geometry
  // (shape/url/rule/image/tileSize) is locked to its registry
  // definition; only style properties may be layered on top.
  let merged = def;

  if (def.name != null) {
    const base = getPattern(def.name);
    if (!base) return null;
    const overrides = {...def};
    delete overrides.name;
    CORE_KEYS.forEach(key => delete overrides[key]);
    merged = {...base, ...overrides};
  }

  const url = merged.url || merged.image;
  let shape;
  let isGenerated = false;
  let tileSize;

  if (!url) {
    tileSize = +merged.tileSize > 0 ? +merged.tileSize : 10;
    const gen = merged.rule || (isLinesShape(merged.shape) ? merged.shape : null);
    if (gen) {
      shape = buildLinesPath(gen, tileSize);
      isGenerated = true;
    } else if (typeof merged.shape === 'string') {
      shape = merged.shape;
    } else {
      return null; // no usable geometry
    }
  }

  const repeat = REPEATS.indexOf(merged.repeat) < 0 ? true : merged.repeat;
  const scale = +merged.scale > 0 ? +merged.scale : 1;

  const out = {
    type: url ? 'image' : 'symbol',
    origin: merged.origin === 'mark' ? 'mark' : 'view',
    repeat,
    scale,
    background: merged.background,
    strokeWidth: merged.strokeWidth,
    shapeRendering: merged.shapeRendering,
    fill: merged.fill,
    stroke: merged.stroke
  };

  if (url) {
    out.url = url;
    // tileSize is a display hint for images: a number, 'bounds', or
    // left undefined to use the image's intrinsic size.
    if (merged.tileSize != null) out.tileSize = merged.tileSize;
  } else {
    out.shape = shape;
    out.tileSize = tileSize;
    if (isGenerated) {
      // rule/lines geometry is stroked, not filled; default a visible
      // stroke when the pattern (or its overrides) declared no color.
      if (out.stroke == null) out.stroke = '#000';
      if (out.strokeWidth == null) out.strokeWidth = 1;
    }

    // foreground is the user-facing color knob: it replaces whichever
    // color(s) the resolved geometry already declares. If neither a
    // fill nor a stroke is declared, foreground (or the '#000' default)
    // becomes the fill.
    const fg = merged.foreground;
    if (fg != null) {
      if (out.stroke != null) out.stroke = fg;
      if (out.fill != null || out.stroke == null) out.fill = fg;
    } else if (out.fill == null && out.stroke == null) {
      out.fill = '#000';
    }
  }

  return out;
}

/**
 * Derive a stable content key for a normalized pattern spec, suitable
 * for def sharing / cache lookup. Equal specs produce equal keys.
 *
 * @param {object} spec - a spec returned by normalizePatternSpec.
 * @return {string} a stable string key.
 */
export function patternKey(spec) {
  return [
    spec.type, spec.tileSize, spec.shape, spec.url, spec.fill, spec.stroke,
    spec.strokeWidth, spec.background, spec.origin, spec.repeat, spec.scale,
    spec.shapeRendering
  ].join('|');
}

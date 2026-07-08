import {pattern as getPattern} from './patterns.js';
import {buildLinesPath} from './lines.js';
import type {
  NormalizedPatternSpec,
  Pattern,
  PatternDefinitionInternal,
  PatternLinesShape
} from './types.js';

// core geometry keys: locked once a named pattern is resolved from the
// registry, since they define the tile-space drawing and must stay
// consistent with the shape actually generated for that name. tileSize
// is locked too — geometry is authored against it at registration time;
// use `scale` to resize a named pattern instead.
const CORE_KEYS: (keyof PatternDefinitionInternal)[] = ['shape', 'url', 'rule', 'tileSize'];
// kept loosely typed (not `(boolean | 'x' | 'y')[]`) so `.indexOf` can be
// called with the current (possibly undefined) repeat value below without
// a null check duplicating the runtime fallback logic.
const REPEATS: readonly unknown[] = [true, false, 'x', 'y'];

/**
 * Detect the user-facing pattern wrapper object, {pattern: {...}}.
 * The legacy v0 string shorthand ({pattern: 'crosshatch'}) is not valid.
 */
export function isPattern(value: unknown): value is Pattern {
  if (!value || typeof value !== 'object') return false;
  const def = (value as {pattern?: unknown}).pattern;
  return !!def && typeof def === 'object';
}

function isLinesShape(shape: unknown): shape is PatternLinesShape {
  return !!(shape && typeof shape === 'object' && (shape as {type?: unknown}).type === 'lines');
}

/**
 * Coerce a value to a positive number, falling back otherwise. Mirrors
 * the JS-native `+value > 0 ? +value : fallback` idiom used throughout
 * this module, guarding the unary `+` against `undefined` operands.
 */
function positiveNumber(value: number | string | undefined, fallback: number): number {
  const n = value == null ? NaN : +value;
  return n > 0 ? n : fallback;
}

/**
 * Normalize a user-facing pattern wrapper object into a canonical,
 * fully-resolved internal pattern spec. Pure: never mutates the input.
 * Returns null for invalid or unrecognized input.
 *
 * @param input - a value that may be a pattern wrapper, {pattern: {...}}.
 * @return the normalized spec, or null.
 */
export function normalizePatternSpec(input: unknown): NormalizedPatternSpec | null {
  if (!isPattern(input)) return null;
  const def = input.pattern as PatternDefinitionInternal;

  // Resolve the pattern definition. A named pattern's core geometry
  // (shape/url/rule/image/tileSize) is locked to its registry
  // definition; only style properties may be layered on top.
  let merged: PatternDefinitionInternal = def;

  if (def.name != null) {
    // a malformed name is invalid input, not an inline pattern
    if (typeof def.name !== 'string' || !def.name) return null;
    const base = getPattern(def.name);
    if (!base) return null;
    const overrides: PatternDefinitionInternal = {...def};
    delete overrides.name;
    for (const key of CORE_KEYS) delete overrides[key];
    merged = {...base, ...overrides};
  }

  // discriminator precedence: url wins over shape/rule when both are present
  const url = merged.url;
  let shape: string | undefined;
  let isGenerated = false;
  let tileSize: number | undefined;

  if (!url) {
    tileSize = positiveNumber(merged.tileSize, 10);
    const gen = merged.rule || (isLinesShape(merged.shape) ? merged.shape : null);
    if (gen) {
      shape = buildLinesPath(gen, tileSize);
      isGenerated = true;
    } else if (typeof merged.shape === 'string') {
      shape = merged.shape;
    }
    if (!shape) return null; // missing or degenerate (empty) geometry
  }

  const repeat = (REPEATS.indexOf(merged.repeat) < 0 ? true : merged.repeat) as boolean | 'x' | 'y';
  const scale = positiveNumber(merged.scale, 1);

  // origin default depends on repeat: a fully repeating pattern is a
  // view-wide field ('view' keeps tiling continuous across marks), while a
  // partial (x/y) or non-repeating pattern is a single strip/tile that only
  // makes sense anchored to the mark it fills — at the view origin it
  // usually misses the mark entirely.
  const origin = merged.origin === 'mark' || merged.origin === 'view'
    ? merged.origin
    : repeat === true ? 'view' : 'mark';

  const out: NormalizedPatternSpec = {
    type: url ? 'image' : 'symbol',
    origin,
    repeat,
    scale,
    background: merged.background,
    strokeWidth: merged.strokeWidth,
    shapeRendering: merged.shapeRendering
  };

  if (url) {
    out.url = url;
    // tileSize is a display hint for images: 'bounds', a positive
    // number, or left undefined to use the image's intrinsic size.
    const ts = merged.tileSize;
    if (ts === 'bounds') {
      out.tileSize = ts;
    } else if (ts != null && +ts > 0) {
      out.tileSize = +ts;
    }
  } else {
    out.shape = shape;
    out.tileSize = tileSize;
    out.fill = merged.fill;
    out.stroke = merged.stroke;

    const hadFill = out.fill != null && out.fill !== 'transparent' && out.fill !== 'none';
    const hadStroke = out.stroke != null;

    // An inline (non-named) shape-string spec with an explicit, positive
    // strokeWidth declares stroked line art (e.g. an 'X' made of open
    // path segments): filling such geometry paints nothing meaningful, so
    // foreground maps to stroke instead of fill. Named patterns are
    // unaffected — their registry defs declare fill/stroke explicitly.
    // Generated lines/rule geometry (isGenerated) already defaults to
    // stroke below, so this only changes inline `shape`-string specs.
    const inlineStroked = def.name == null && !isGenerated &&
      !hadFill && !hadStroke && merged.strokeWidth != null && merged.strokeWidth > 0;

    if (isGenerated) {
      // rule/lines geometry is stroked, not filled; default a visible
      // stroke when the pattern (or its overrides) declared no color.
      if (out.stroke == null) out.stroke = '#000';
      if (out.strokeWidth == null) out.strokeWidth = 1;
    } else if (inlineStroked) {
      out.stroke = '#000';
    }

    // foreground is the user-facing color knob: it replaces whichever
    // color(s) the resolved geometry already declares. Transparent/none
    // fills are load-bearing design (outline-only shapes), not color
    // choices, so they are preserved rather than replaced. If neither a
    // fill nor a stroke is declared, foreground (or the '#000' default)
    // becomes the fill.
    const fg = merged.foreground;
    const hadStrokeNow = out.stroke != null;
    if (fg != null) {
      if (hadStrokeNow) out.stroke = fg;
      if (hadFill || !hadStrokeNow) out.fill = fg;
    } else if (!hadFill && !hadStrokeNow) {
      out.fill = '#000';
    }
  }

  return out;
}

/**
 * Derive a stable content key for a normalized pattern spec, suitable
 * for def sharing / cache lookup. Equal specs produce equal keys.
 *
 * @param spec - a spec returned by normalizePatternSpec.
 * @return a stable string key.
 */
export function patternKey(spec: NormalizedPatternSpec): string {
  // JSON-serialize the slots so values containing delimiter characters
  // cannot collide, and undefined (-> null) stays distinct from ''.
  return JSON.stringify([
    spec.type, spec.tileSize, spec.shape, spec.url, spec.fill, spec.stroke,
    spec.strokeWidth, spec.background, spec.origin, spec.repeat, spec.scale,
    spec.shapeRendering, spec.fit
  ]);
}

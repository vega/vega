// -----------------------------------------------------------------------
// Public pattern-fill types.
//
// These are kept STRUCTURALLY IDENTICAL (field-for-field, including the
// JSDoc) to the hand-written declarations in
// packages/vega-typings/types/spec/encode.d.ts. Consolidating the two
// copies into one shared source is deliberately deferred: the
// vega-typings copies feed the ts-json-schema-generator pipeline that
// derives the Vega JSON schema, and reworking that pipeline is out of
// scope for this migration.
// -----------------------------------------------------------------------

// Pattern fill definitions. Common style properties shared by all variants;
// geometry-defining properties (shape/url/rule/tileSize) differ per variant
// and are locked (not overridable) once resolved from a named pattern.
export interface PatternDefinitionBase {
  /**
   * The foreground color for the pattern geometry. Replaces whichever color(s)
   * the resolved geometry declares (stroke and/or fill).
   *
   * __Default value:__ the color(s) declared by the pattern geometry, or `"#000"` if none.
   */
  foreground?: string;
  /**
   * The background color painted behind the pattern tiles.
   *
   * __Default value:__ `undefined` (no background).
   */
  background?: string;
  /**
   * The stroke width, in pixels, for stroked pattern geometry.
   *
   * __Default value:__ `1` for generated rule/lines geometry, otherwise `undefined`.
   */
  strokeWidth?: number;
  /**
   * The tiling mode: `true` (the default) repeats in both directions,
   * `"x"` and `"y"` repeat along one axis only, and `false` draws a
   * single tile.
   *
   * __Default value:__ `true`
   */
  repeat?: boolean | 'x' | 'y';
  /**
   * The coordinate system pattern tiles anchor to: `"view"` for a shared,
   * view-wide tiling or `"mark"` to anchor tiles to each mark's bounds.
   *
   * __Default value:__ `"view"` when `repeat` is `true` (the default),
   * `"mark"` for partial (`"x"`/`"y"`) or non-repeating patterns.
   */
  origin?: 'view' | 'mark';
  /**
   * A scale factor applied to the pattern tiles; the resize control for
   * named patterns, whose tileSize is locked.
   *
   * __Default value:__ `1`
   */
  scale?: number;
  /**
   * The [shape-rendering hint](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/shape-rendering)
   * for pattern geometry (e.g. `"crispEdges"`; SVG output only).
   *
   * __Default value:__ `undefined` (renderer default).
   */
  shapeRendering?: string;
}

export interface PatternLinesShape {
  type: 'lines';
  /** Angle in degrees, or array of angles for multi-directional lines (e.g. crosshatch). */
  angle?: number | number[];
  spacing?: number;
  bleed?: number;
  phase?: number;
}

export interface PatternNamed extends PatternDefinitionBase {
  name: string;
}

export interface PatternSymbol extends PatternDefinitionBase {
  shape: string | PatternLinesShape;
  /**
   * The pattern tile size, in pixels.
   *
   * __Default value:__ `10`
   */
  tileSize?: number;
}

export interface PatternRule extends PatternDefinitionBase {
  rule: {
    /** Angle in degrees, or array of angles for multi-directional lines (e.g. crosshatch). */
    angle?: number | number[];
    spacing?: number;
    bleed?: number;
    phase?: number;
  };
  /**
   * The pattern tile size, in pixels.
   *
   * __Default value:__ `10`
   */
  tileSize?: number;
}

export interface PatternImage extends PatternDefinitionBase {
  url: string;
  /**
   * The pattern tile size: a size in pixels, or `"bounds"` to fit the mark bounds.
   *
   * __Default value:__ `undefined` (the image's intrinsic size).
   */
  tileSize?: number | 'bounds';
}

export type PatternDefinition = PatternNamed | PatternSymbol | PatternRule | PatternImage;

// Wrapper used in encoding values: { value: { pattern: PatternDefinition } }
export interface Pattern {
  pattern: PatternDefinition;
}

// -----------------------------------------------------------------------
// Internal-only types below. Not part of the public vega-typings surface.
// -----------------------------------------------------------------------

/**
 * Loosely-typed internal view of a pattern definition, used only inside
 * vega-pattern's normalizer. The public PatternDefinition (above)
 * intentionally omits `fill`/`stroke` -- callers use `foreground` -- but
 * registry entries and inline shape specs still carry them at runtime
 * (registry.ts defines its built-ins directly in terms of fill/stroke).
 * This flattened, all-optional type widens PatternDefinition just enough
 * to type-check those internal reads without changing the public surface
 * or runtime behavior.
 */
export interface PatternDefinitionInternal {
  name?: string;
  shape?: string | PatternLinesShape;
  rule?: PatternRuleSpec;
  url?: string;
  tileSize?: number | 'bounds';
  repeat?: boolean | 'x' | 'y';
  fill?: string;
  stroke?: string;
  foreground?: string;
  background?: string;
  strokeWidth?: number;
  origin?: 'view' | 'mark';
  scale?: number;
  shapeRendering?: string;
}

export interface PatternRuleSpec {
  angle?: number | number[];
  spacing?: number;
  bleed?: number;
  phase?: number;
}

/**
 * A resolved, registered pattern definition as stored in the pattern
 * registry (see registry.ts / patterns.ts). Distinct from
 * PatternDefinition: it has no `name` (it *is* the thing a name resolves
 * to) and, unlike the public API, carries `fill`/`stroke` directly.
 */
export interface PatternRegistryEntry {
  shape?: string;
  rule?: PatternRuleSpec;
  tileSize?: number;
  background?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * The canonical, fully-resolved internal pattern spec produced by
 * normalizePatternSpec. This is what scenegraph/renderer code consumes.
 */
export interface NormalizedPatternSpec {
  type: 'symbol' | 'image';
  tileSize?: number | 'bounds';
  shape?: string;
  url?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  background?: string;
  origin: 'view' | 'mark';
  repeat: boolean | 'x' | 'y';
  scale: number;
  shapeRendering?: string;
  fit?: 'swatch';
}

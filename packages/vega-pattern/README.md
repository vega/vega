# vega-pattern

Pattern (texture and image) fills for Vega mark encodings.

This package adds repeating **pattern fills and strokes** to Vega, in the same object-valued family as [gradients](https://vega.github.io/vega/docs/types/#Gradient). A pattern can be used as a color substitute in a mark `fill` or `stroke` [encoding](https://vega.github.io/vega/docs/marks/), or a [scale range](https://vega.github.io/vega/docs/scales/#range). The package provides a registry of built-in textures, two ordinal [schemes](#pattern-schemes), and the normalization utilities Vega's renderers consume.

Most specifications use patterns declaratively, as `{"pattern": {…}}` objects, and never call this module directly; see the [pattern type documentation](https://vega.github.io/vega/docs/types/#Pattern) for the authoritative specification syntax. The JavaScript [API](#api-reference) below is for registering custom patterns and for tooling built on Vega's pattern model.

## Pattern Definitions

A pattern is an object with a single `pattern` property. Four variants are distinguished by which geometry-defining key is present.

### Named

References a [built-in pattern](#built-in-patterns) (or one added via [`pattern`](#pattern)) by name. Geometry and tile size are locked at registration; use `foreground`/`background` to recolor and `scale` to resize.

```json
{
  "pattern": {
    "name": "diagonal-stripe",
    "foreground": "#4c78a8"
  }
}
```

### Symbol

An inline pattern from an [SVG path string](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d) in tile coordinates, or from a lines generator object. Path geometry is filled by default; a positive `strokeWidth` on a path with no declared color instead declares stroked line art.

```json
{
  "pattern": {
    "shape": "M2,2 L8,8 M8,2 L2,8",
    "tileSize": 10,
    "strokeWidth": 1.5,
    "foreground": "teal"
  }
}
```

### Rule

Generates stripe and hatch designs from angled line sets, without hand-writing paths. Accepts `angle` (a number or array of degrees), and optional `spacing`, `bleed`, and `phase`.

```json
{
  "pattern": {
    "rule": {
      "angle": [45, 135]
    },
    "foreground": "purple"
  }
}
```

### Image

Tiles an image from a URL or [data URI](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs). Set `tileSize` to a pixel width (height preserves aspect ratio) or `"bounds"` to fit the filled mark; omit it to use the image's intrinsic size.

```json
{
  "pattern": {
    "url": "data:image/png;base64,…",
    "tileSize": 16,
    "repeat": "x"
  }
}
```

### Common Properties

All variants accept the following style properties.

| Property | Type | Description |
| :-- | :-- | :-- |
| `foreground` | Color | The foreground color for the pattern geometry, replacing whichever color(s) the geometry declares (stroke and/or fill). Transparent or `"none"` fills are preserved, so outline-only designs stay hollow. Defaults to the geometry's declared color(s), or black. Not applicable to image patterns. |
| `background` | Color | A color painted behind the pattern tiles. By default no background is painted and the mark shows through between the geometry. |
| `strokeWidth` | Number | The stroke width, in pixels, for stroked geometry (default `1` for generated rule/lines geometry). |
| `repeat` | Boolean \| String | Tiling mode: `true` (default) tiles in both directions, `"x"` or `"y"` tiles along one axis only, and `false` draws a single tile. |
| `origin` | String | The coordinate system tiles anchor to: `"view"` for a shared, view-wide tiling continuous across marks, or `"mark"` to anchor tiles to each mark's own bounds. Defaults to `"view"` when `repeat` is `true`, and to `"mark"` otherwise. Ignored for `text` and `rule` marks, which are always mark-anchored. |
| `scale` | Number | A scale factor applied to the pattern tiles (default `1`). The resize control for named patterns, whose `tileSize` is locked. |
| `shapeRendering` | String | A [shape-rendering hint](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/shape-rendering) such as `"crispEdges"` (SVG output only). |

## Built-in Patterns

Thirteen patterns are registered by default, reproducing a common texture vocabulary. All are recolorable through the `foreground` property and resizable through `scale`.

| Name | Description |
| :-- | :-- |
| `diagonal-stripe` | Parallel diagonal lines. |
| `horizontal-stripe` | Parallel horizontal lines. |
| `vertical-stripe` | Parallel vertical lines. |
| `crosshatch` | Crossed diagonal lines (±45°). |
| `grid` | Crossed horizontal and vertical lines. |
| `circles` | A grid of filled dots. |
| `crosses` | A grid of diagonal crosses (×). |
| `caps` | A grid of chevrons (^). |
| `squares` | A grid of outlined squares. |
| `nylon` | An interlocking woven-nylon motif. |
| `waves` | Horizontal wavy lines. |
| `woven` | A basket-weave of diagonal segments. |
| `houndstooth` | A filled houndstooth check. |

Rendered swatches for every built-in appear in the [color scheme documentation](https://vega.github.io/vega/docs/schemes/#patterns).

## Pattern Schemes

Two ordinal [schemes](https://vega.github.io/vega/docs/schemes/) of pattern values are registered with [`vega.scheme`](https://vega.github.io/vega/docs/api/extensibility/#schemes), for use as discrete scale ranges. Because pattern values cannot be interpolated, both are valid only on scales with discrete (or discretizing) domains.

### `patterns`

A texture-only palette, ordered for maximal pairwise distinctness. Intended for *redundant* encoding: layering texture over a color channel so categories remain distinguishable without color.

```json
{
  "name": "color",
  "type": "ordinal",
  "domain": {…},
  "range": {
    "scheme": "patterns"
  }
}
```

### `monochrome`

A print-friendly palette interleaving solid greyscale values with textures, the classic value-plus-texture approach for grayscale figures. It leads with solid black and never places two flat greys adjacent.

```json
{
  "name": "color",
  "type": "ordinal",
  "domain": {…},
  "range": {
    "scheme": "monochrome"
  }
}
```

Pattern values may also be listed directly in a range array, mixed freely with plain colors: `"range": [{"pattern": {"name": "crosshatch"}}, "#f58518"]`.

## API Reference

<a name="pattern" href="#pattern">#</a>
vega.<b>pattern</b>(<i>name</i>[, <i>definition</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-pattern/src/patterns.ts "Source")

Registry function for adding and accessing named pattern definitions, in the manner of [`vega.scheme`](https://vega.github.io/vega/docs/api/extensibility/#schemes). The *name* argument is a String; names are *not* case sensitive. If *definition* is not provided, this method returns the matching registry entry, or `null` if none exists. If *definition* is provided, it is stored (a shallow copy) under *name*, overwriting any existing entry. Re-exported on the top-level `vega` namespace.

A definition declares the pattern geometry with exactly one of:

- `shape` (an SVG path string in tile coordinates)
- `rule` (an angled lines generator)
- `url` (an image to tile), along with a `tileSize` and optional default `fill`, `stroke`, `strokeWidth`, and `background`.

Once registered, a pattern's geometry and `tileSize` are locked: specifications referencing it by name may recolor and resize it, but not alter its design.

```js
// register a custom pattern, then reference it by name in a spec
vega.pattern('bricks', {
  shape: 'M0,6 H12 M6,0 V6',
  tileSize: 12,
  stroke: '#000',
  strokeWidth: 1
});

vega.pattern('bricks'); // { shape: 'M0,6 H12 M6,0 V6', tileSize: 12, … }
vega.pattern('nope');   // null
```

<a name="pattern-expression" href="#pattern-expression">#</a>
<b>pattern</b>(<i>spec</i>[, <i>overrides</i>]) · expression function
[<>](https://github.com/vega/vega/blob/master/packages/vega-functions/src/functions/pattern.js "Source")

Vega's [expression language](https://vega.github.io/vega/docs/expressions/#pattern) also provides a `pattern` function (via [vega-functions](https://github.com/vega/vega/tree/master/packages/vega-functions), the [`gradient`](https://vega.github.io/vega/docs/expressions/#gradient) analog) for building pattern values inside signal expressions. The *spec* may be a registered pattern name, an existing pattern value (such as the output of a scale with a pattern-valued range), or an inner definition object; the optional *overrides* object is merged onto the resulting definition, taking precedence. The canonical use is composing a texture from one scale with a foreground color from another:

```json
"fill": {
  "signal": "pattern(scale('tex', datum.type), {foreground: scale('color', datum.group)})"
}
```

The function is pure construction: it never mutates its input (shared scale range values are safe), and name resolution against the registry happens downstream at render time.

<a name="isPattern" href="#isPattern">#</a>
<b>isPattern</b>(<i>value</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-pattern/src/normalizer.ts "Source")

Returns `true` if *value* is a pattern wrapper object - an object with an object-valued `pattern` property - and `false` otherwise.

<a name="normalizePatternSpec" href="#normalizePatternSpec">#</a>
<b>normalizePatternSpec</b>(<i>value</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-pattern/src/normalizer.ts "Source")

Resolves a pattern wrapper into a canonical, fully-resolved internal spec for the renderers: it looks up named patterns in the registry, applies defaults, expands `rule`/lines geometry to a path, and normalizes colors and `repeat`/`origin`. Returns the normalized spec, or `null` for input that is not a valid pattern. Pure, so it never mutates its input. Used internally by [vega-scenegraph](https://github.com/vega/vega/tree/main/packages/vega-scenegraph).

<a name="patternKey" href="#patternKey">#</a>
<b>patternKey</b>(<i>spec</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-pattern/src/normalizer.ts "Source")

Returns a stable string key for a normalized pattern *spec* (as produced by [normalizePatternSpec](#normalizePatternSpec)). Equal specs produce equal keys, so renderers can share and cache pattern definitions across items with identical patterns.

<a name="buildLinesPath" href="#buildLinesPath">#</a>
<b>buildLinesPath</b>(<i>options</i>, <i>tileSize</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-pattern/src/lines.ts "Source")

Expands a lines generator into an SVG path string of parallel line segments, clipped to a *tileSize* square tile. This is the geometry behind [rule patterns](#pattern-definitions). The *options* object accepts:

- `angle` - line angle in degrees, or an array of angles that unions multiple line sets (default `45`).
- `spacing` - spacing between parallel lines. Defaults per angle to the largest value that tiles seamlessly (`tileSize / 2` for axis-aligned angles, `tileSize / √2` for the 45° family). An explicit spacing tiles seamlessly only when the tile size projected onto the line normal is an integer multiple of it.
- `bleed` - distance lines extend past the tile edge, to avoid seams when tiled (default `1`).
- `phase` - an offset applied along the line normal (default `0`).

<a name="patternScheme" href="#patternScheme">#</a>
<b>patternScheme</b> | <b>monochromeScheme</b>
[<>](https://github.com/vega/vega/blob/master/packages/vega-pattern/src/scheme.ts "Source")

The arrays backing the [`patterns` and `monochrome` schemes](#pattern-schemes). Vega registers these with `vega.scheme` on startup; import them directly only when building a custom scale or scheme setup.

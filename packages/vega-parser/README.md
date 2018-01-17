# vega-parser

Parse Vega specifications to runtime dataflow descriptions.

## API Reference

<a name="parse" href="#parse">#</a>
vega.<b>parse</b>(<i>specification</i>[, <i>config</i>])
[<>](https://github.com/vega/vega-loader/blob/master/src/parse.js "Source")

Parses a Vega JSON *specification* as input and produces a reactive dataflow
graph description for a visualization. The output description uses the format
of the [vega-runtime](https://github.com/vega/vega-runtime) module. To create
a visualization, use the runtime dataflow description as the input to a Vega
[View](https://github.com/vega/vega-view) instance.

The optional *config* object provides visual encoding defaults for marks,
scales, axes and legends. Different configuration settings can be used to
change choices of layout, color, type faces, font sizes and more to realize
different chart themes. For more, see the configuration documentation below
or view the source code defining Vega's
[default configuration](https://github.com/vega/vega-parser/blob/master/src/config.js).

In addition to passing configuration options to this [parse](#parse) method,
Vega JSON specifications may also include a top-level `"config"` block
specifying configuration properties. Configuration options defined within a
Vega JSON file take precedence over those provided to the parse method.

## Configuration Reference

The Vega parser accepts a configuration file that defines default settings
for a variety of visual encoding choices. Different configuration files can be
used to "theme" charts with a customized look and feel. A configuration file is
simply a JavaScript object with a set of named properties, grouped by type.

- [Top-Level Properties](#top-level-properties)
- [Event Properties](#event-properties)
- [Mark Properties](#mark-properties)
- [Style Properties](#style-properties)
- [Axis Properties](#axis-properties)
- [Legend Properties](#legend-properties)
- [Scale Range Properties](#scale-range-properties)

### Top-Level Properties

Properties defined in the top-level scope of the configuration object.

- *autosize*: Default automatic sizing setting. Options: `"none"`, `"pad"`, `"fit"`.
- *background*: Background color of the view component, or `null` for transparent.
- *group*: Object containing default properties for the top-level group mark representing the data rectangle of a chart. Valid properties of this object are mark properties such as `"fill"`, `"stroke"` and `"strokeWidth"`.

### Event Properties

Properties for event handling configuration, defined within an `"events"` property block.

- *defaults*: An object describing which events that originate within the Vega view should have their default behavior suppressed by invoking the [event.preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) method. The _defaults_ object should have a single property: either `"prevent"` (to indicate which events should have default behavior suppressed) or `"allow"` (to indicate only those events whose default behavior should be allowed). This property accepts either a boolean value (to prevent/allow all events) or an array of event type strings.

For example, to prevent the default behavior for all events originating within a Vega view except for `wheel` events:

```json
"events": {
  "defaults": {
    "allow": ["wheel"]
  }
}
```

### Mark Properties

Properties defining default attributes for visualized marks. These properties
are defined within blocks with names matching a valid mark type (e.g.,
`"area"`, `"line"`, `"rect"`). The valid properties within each block consist
of the legal mark properties (e.g., `"fill"`, `"stroke"`, `"size"`, `"font"`).

For example, to set default fill color and size for symbol marks:

```json
"symbol": {
  "fill": "steelblue",
  "size": 64
}
```

Defaults for fill or stroke color will _only_ be applied if neither the
`"fill"` not `"stroke"` properties are defined.

In addition, global defaults for **all** mark types can be set using
the `"mark"` config property. For example, to set a global opacity value:

```json
"mark": {
  "opacity": 0.8
}
```

### Style Properties

In addition to the default mark properties above, default values can be
further customized using named _styles_ defined under the `style` block
in the config. Styles can then be invoked by including a `style`
directive within a mark definition.

For example, to set a default shape and stroke width for symbol marks
with a style named `"square"`:

```json
"style": {
  "square": {
    "shape": "square",
    "strokeWidth": 2
  }
}
```

Style settings take precedence over default mark settings, but are
overridden by the axis, legend, and title properties described below.

### Axis Properties

Properties defining default settings for axes. These properties are defined
within an `"axis"` property block, which applies to all axes. Additional
property blocks can target more specific axis types based on the orientation
(`"axisX"`, `"axisY"`, `"axisLeft"`, `"axisTop"`, etc.) or band scale type
(`"axisBand"`). For example, properties defined under the `"axisBand"` block
will only apply to axes visualizing `"band"` scales. If multiple axis config
blocks apply to a single axis, type-based options take precedence over
orientation-based options, which in turn take precedence over general options.

- *minExtent*: The minimum extent (in pixels) that axis ticks and labels should use. This determines a minimum offset value for axis titles.
- *maxExtent*: The maximum extent (in pixels) that axist ticks and labels should use. This determines a maximum offset value for axis titles.
- *bandPosition*: An interpolation fraction indicating where, for `band` scales, axis ticks should be positioned. A value of `0` places ticks at the left edge of their bands. A value of `0.5` places ticks in the middle of their bands.
- *domain*: Boolean flag indicating if axis domain line should be included by default.
- *domainColor*: Color of axis domain line.
- *domainWidth*: Stroke width of axis domain line.
- *grid*: Boolean flag indicating if axis grid lines should be included by default.
- *gridWidth*: Stroke width of axis grid lines.
- *gridColor*: Color of axis grid lines.
- *gridDash*: Stroke dash of axis grid lines (or `[]` for solid lines).
- *gridOpacity*: Opacity of axis grid lines.
- *labels*: Boolean flag indicating if axis tick labels should be included by default.
- *labelAngle*: Angle in degrees of axis tick labels.
- *labelColor*: Text color for axis tick labels.
- *labelFlush*: Boolean flag or pixel distance threshold value for performing a "flush" layout of axis labels. For an x-axis, flush alignment will left-align the left-most labels (if within the distance threshold from the axis start) and similarly right-align the right-most labels. If `true`, a pixel tolerance of 1 is used.
- *labelFlushOffset*: Offset in pixels for flush-adjusted labels (default `0`).
- *labelFont*: Font name for axis tick labels.
- *labelFontSize*: Font size for axis tick labels.
- *labelFontWeight*: Font weight for axis tick labels.
- *labelLimit*: Maximum allowed pixel width of axis tick labels.
- *labelPadding*: Padding in pixels betweem axis ticks and tick labels.
- *ticks*: Boolean flag indicating if axis tick marks should be included by default.
- *tickColor*: Color for axis ticks.
- *tickExtra*: Boolean flag indicating if an extra axis tick should be added for the initial position of the axis. This flag is useful for styling axes for `band` scales such that ticks are placed on band boundaries rather in the middle of a band. Use in conjunction with `"bandPostion": 1` and an axis `"padding"` value of `0`.
- *tickRound*: Boolean flag indicating if pixel position values should be rounded to the nearest integer.
- *tickSize*: Size (or length, in pixels) of axis ticks.
- *tickWidth*: Width (in pixels) of axis ticks.
- *titleColor*: Text color for axis titles.
- *titleFont*: Font name for axis titles.
- *titleFontSize*: Font size for axis titles.
- *titleFontWeight*: Font weight for axis titles.
- *titleAlign*: Horizontal text alignment for axis titles.
- *titleLimit*: Maximum allowed pixel width of axis titles.
- *titlePadding*: Padding (in pixels) between axis tick labels and titles.

### Legend Properties

Properties defining default settings for legends. These properties are defined
within a `"legend"` property block.

- *orient*: Default legend orientation (e.g., `"right"` or `"left"`).
- *offset*: Offset (in pixels) of the legend from the chart body.
- *padding*: Padding (in pixels) between legend border and contents.
- *entryPadding*: Padding (in pixels) between legend entries in a symbol legend.
- *gradientWidth*: Width (in pixels) of color ramp gradients.
- *gradientHeight*: Height (in pixels) of color ramp gradients.
- *gradientStrokeColor*: Stroke color for color ramp gradient borders.
- *gradientStrokeWidth*: Stroke width for color ramp gradient borders.
- *gradientLabelBaseline*: Text baseline for color ramp gradient labels.
- *gradientLabelLimit*: Maximum allowed pixel width of gradient labels.
- *gradientLabelOffset*: Vertical offset (in pixels) for color ramp gradient labels.
- *labelColor*: Text color for legend labels.
- *labelFont*: Font name for legend labels.
- *labelFontSize*: Font size (in pixels) for legend labels.
- *labelFontWeight*: Font weight for legend labels.
- *labelAlign*: Horizontal text alignment for legend labels.
- *labelBaseline*: Vertical text baseline for legend labels.
- *labelLimit*: Maximum allowed pixel width of legend labels.
- *labelOffset*: Horizontal offset (in pixels) between legend symbols and labels.
- *symbolType*: Default shape type (such as `"circle"`) for legend symbols.
- *symbolSize*: Default symbol area size (in pixels<sup>2</sup>).
- *symbolFillColor*: Default fill color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend.
- *symbolStrokeColor*: Default stroke color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend.
- *symbolStrokeWidth*: Default legend symbol stroke width.
- *titleColor*: Text color for legend titles.
- *titleFont*: Font name for legend titles.
- *titleFontSize*: Font size (in pixels) for legend titles.
- *titleFontWeight*: Font weight for legend titles.
- *titleAlign*: Horizontal text alignment for legend titles.
- *titleBaseline*: Vertical text baseline for legend titles.
- *titleLimit*: Maximum allowed pixel width of the legend title.
- *titlePadding*: Padding (in pixels) between the legend title and entries.

### Title Properties

Properties defining default settings for titles. These properties are defined
within a `"title"` property block.

- *orient*: Default title orientation (`"top"`, `"bottom"`, `"left"`, or `"right"`).
- *offset*: Offset (in pixels) of the title from the chart body and axes.
- *anchor*: Title anchor position (`"start"`, `"middle"`, or `"end"`).
- *color*: Text color of title text.
- *font*: Font name for title text.
- *fontSize*: Font size (in pixels) of title text.
- *fontWeight*: Font weight of title text.
- *angle*: Angle in degrees of title text.
- *baseline*: Vertical text baseline for title.
- *limit*: Maximum allowed pixel width of title text.

### Scale Range Properties

Properties defining named range arrays that can be used within scale
range definitions (such as `{"type": "ordinal", "range": "category"}`).
These properties are defined within a `"range"` block.

- *category*: Default color scheme for categorical data.
- *ordinal*: Default color scheme for rank-ordered data.
- *ramp*: Default color scheme for sequential quantitative ramps.
- *diverging*: Default color scheme for diverging quantitative ramps.
- *heatmap*: Default color scheme for quantitative heatmaps.
- *symbol*: Array of symbol names for the default shape palette.

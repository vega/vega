---
layout: spec
title: Config
permalink: /docs/config/index.html
---

A **config** object defines default visual values to set a visualization's theme.

The Vega parser accepts a JSON configuration file that defines default settings for a variety of visual encoding choices. Different configuration files can be used to "theme" charts with a customized look and feel. A configuration file is simply a JSON object with a set of named properties, grouped by type. To provide a configuration file at parse-time, simply pass an additional parameter to the parse method:

```js
var runtime = vega.parse(spec, config);
```

In addition, Vega JSON specifications may contain a single, top-level `config` property to override any configuration settings. Any configuration provided within the specification itself will take precedence over external configurations passed to the parser.

For example, this Vega spec includes light-gray axis grid lines by default:

{: .suppress-error}
```json
{
  "$schema": "https://vega.github.io/schema/vega/v4.json",
  "width": 500,
  "height": 200,
  "config": {
    "axis": {
      "grid": true,
      "gridColor": "#dedede"
    }
  },
  ...
}
```

## <a name="reference"></a>Config Reference

- [View Properties](#view)
- [Event Properties](#event)
- [Mark Properties](#mark)
- [Style Properties](#style)
- [Axis Properties](#axes)
- [Legend Properties](#legends)
- [Title Properties](#title)
- [Scale Range Properties](#scale-range)
{: .column-list }

## <a name="view"></a>View Properties

Properties defined in the top-level scope of the configuration object.

| Property      | Type                                 | Description    |
| :------------ | :----------------------------------: | :------------- |
| autosize      | {% include type t="String|Object" %} | Default automatic sizing setting. Valid string values are `"pad"`, `"fit"` or `"none"`. See the [autosize documentation](../specification/#autosize) for more. |
| background    | {% include type t="Color" %}         | Background color of the view component, or `null` for transparent. |
| group         | {% include type t="Object" %}        | Default properties for the top-level group mark representing the data rectangle of a chart. Valid properties of this object are mark properties such as `"fill"`, `"stroke"` and `"strokeWidth"`. |

### Usage

Set default view background and chart plotting area background colors:

```json
{
  "background": "white",
  "group": {
    "fill": "#dedede"
  }
}
```

[Back to Top](#reference)


## <a name="events"></a> Event Properties

Properties for event handling configuration, defined within an `"events"` property block.

| Property      | Type                                 | Description    |
| :------------ | :----------------------------------: | :------------- |
| defaults      | {% include type t="Object" %}        | An object describing which events that originate within the Vega view should have their default behavior suppressed by invoking the [event.preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) method. The _defaults_ object should have a single property: either `"prevent"` (to indicate which events should have default behavior suppressed) or `"allow"` (to indicate only those events whose default behavior should be allowed). This property accepts either a boolean value (to prevent/allow all events) or an array of event type strings.|

### Usage

To prevent the default behavior for all events originating within a Vega view:

{: .suppress-error}
```json
"events": {
  "defaults": {
    "prevent": true
  }
}
```


To prevent the default behavior for all events originating within a Vega view, except for `wheel` events:

{: .suppress-error}
```json
"events": {
  "defaults": {
    "allow": ["wheel"]
  }
}
```

[Back to Top](#reference)


## <a name="mark"></a> Mark Properties

Properties defining default property values for each mark type. These properties are defined within blocks with names matching a valid mark type (e.g., `"area"`, `"line"`, `"rect"`). The valid properties within each block consist of the legal mark properties (e.g., `"fill"`, `"stroke"`, `"size"`, `"font"`). Global defaults for _all_ mark types can be set using the `"mark"` property.

_Important limitations_:
- Defaults for fill or stroke color will be applied only if neither `"fill"` nor `"stroke"` are defined in the Vega spec.
- Defaults set using the top-level `"mark"` property will be overridden by any defaults defined for more specific mark types (e.g., `"rect"`). Vega's built-in configuration includes default fill or stroke colors for a number of specific mark types, and these will take precedence over new fill or stroke colors set only on the top-level `"mark"`.

### Usage

To set a default fill color and size for `symbol` marks:

```json
{
  "symbol": {
    "fill": "steelblue",
    "size": 64
  }
}
```

To set a global opacity value for all mark types:

```json
{
  "mark": {
    "opacity": 0.8
  }
}
```

[Back to Top](#reference)


## <a name="style"></a>Style Properties

In addition to the default mark properties above, default values can be further customized using named _styles_ defined under the `style` block
in the config. Styles can then be invoked by including a `style` directive within a mark definition.

For example, to set a default shape and stroke width for symbol marks with a style named `"square"`:

{: .suppress-error}
```json
"style": {
  "square": {
    "shape": "square",
    "strokeWidth": 2
  }
}
```

In addition to custom `style` names, Vega includes the following built-in style names:
- `guide-label`: styles for axis and legend labels
- `guide-title`: styles for axis and legend titles
- `group-title`: styles for chart and header titles

Style settings take precedence over default mark settings, but are overridden by the axis, legend, and title properties described below.

[Back to Top](#reference)


## <a name="axes"></a>Axis Properties

Properties defining default settings for axes. These properties are defined under the `"axis"` property in the config object, in which case the settings apply to _all_ axes.

Additional property blocks can target more specific axis types based on the orientation (`"axisX"`, `"axisY"`, `"axisLeft"`, `"axisTop"`, etc.) or band scale type (`"axisBand"`). For example, properties defined under the `"axisBand"` property will only apply to axes visualizing `"band"` scales. If multiple axis config blocks apply to a single axis, type-based options take precedence over orientation-based options, which in turn take precedence over general options.

| Property        | Type                            | Description    |
| :-------------- | :-----------------------------: | :------------- |
| bandPosition    | {% include type t="Number" %}   | An interpolation fraction indicating where, for `band` scales, axis ticks should be positioned. A value of `0` places ticks at the left edge of their bands. A value of `0.5` places ticks in the middle of their bands. |
| domain          | {% include type t="Boolean" %}  | Boolean flag indicating if axis domain line should be included by default. |
| domainColor     | {% include type t="Color" %}    | Color of axis domain line. |
| domainOpacity   | {% include type t="Number" %}   | Opacity of axis domain line. {% include tag ver="4.1" %} |
| domainWidth     | {% include type t="Number" %}   | Stroke width of axis domain line. |
| grid            | {% include type t="Boolean" %}  | Boolean flag indicating if axis grid lines should be included by default. |
| gridColor       | {% include type t="Color" %}    | Color of axis grid lines. |
| gridDash        | {% include type t="Number[]" %} | Stroke dash of axis grid lines (or `[]` for solid lines). |
| gridOpacity     | {% include type t="Number" %}   | Opacity of axis grid lines. |
| gridWidth       | {% include type t="Number" %}   | Stroke width of axis grid lines. |
| labels          | {% include type t="Boolean" %}  | Boolean flag indicating if axis tick labels should be included by default. |
| labelAlign    | {% include type t="String" %}  | Horizontal text alignment of axis tick labels, overriding the default setting for the axis orientation. |
| labelAngle    | {% include type t="Number" %}  | Angle in degrees of axis tick labels. |
| labelBaseline   | {% include type t="String" %}  | Vertical text baseline of axis tick labels, overriding the default setting for the axis orientation. |
| labelBound      | {% include type t="Boolean|Number" %} | Boolean flag or pixel tolerance value for removal of labels that exceed the axis range. |
| labelColor      | {% include type t="Color" %}    | Text color of axis tick labels. |
| labelFlush      | {% include type t="Boolean|Number" %} | Boolean flag or pixel distance threshold value for performing a "flush" layout of axis labels. For an x-axis, flush alignment will left-align the left-most labels (if within the distance threshold from the axis start) and similarly right-align the right-most labels. If `true`, a pixel tolerance of 1 is used. |
| labelFlushOffset| {% include type t="Number" %} | Offset in pixels for flush-adjusted labels (default `0`). |
| labelFont       | {% include type t="String" %}   | Font name for axis tick labels. |
| labelFontSize   | {% include type t="Number" %}   | Font size of axis tick labels. |
| labelFontWeight | {% include type t="String|Number" %}   | Font weight of axis tick labels. |
| labelLimit      | {% include type t="Number" %}   | The maximum allowed length in pixels of axis tick labels. |
| labelOpacity    | {% include type t="Number" %}   | Opacity of axis tick labels. {% include tag ver="4.1" %} |
| labelOverlap    | {% include type t="Boolean|String" %} | The strategy to use for resolving overlap of axis labels. If `false`, no overlap reduction is attempted. If `true` or `"parity"`, a strategy of removing every other label is used (this works well for standard linear axes). If `"greedy"`, a linear scan of the labels is performed, removing any labels that overlaps with the last visible label (this often works better for log-scaled axes).|
| labelPadding    | {% include type t="Number" %}   | Padding in pixels between axis ticks and tick labels. |
| maxExtent       | {% include type t="Number" %}   | The maximum extent in pixels that axis ticks and labels should use. This determines a maximum offset value for axis titles. |
| minExtent       | {% include type t="Number" %}   | The minimum extent in pixels that axis ticks and labels should use. This determines a minimum offset value for axis titles. |
| ticks           | {% include type t="Boolean" %}  | Boolean flag indicating if axis tick marks should be included by default. |
| tickColor       | {% include type t="Color" %}    | Color of axis ticks. |
| tickExtra       | {% include type t="Boolean" %}  | Boolean flag indicating if an extra axis tick should be added for the initial position of the axis. This flag is useful for styling axes for `band` scales such that ticks are placed on band boundaries rather in the middle of a band. Use in conjunction with `"bandPostion": 1` and an axis `"padding"` value of `0`. |
| tickOffset      | {% include type t="Number" %}   | Position offset in pixels to apply to ticks, labels, and gridlines. |
| tickOpacity     | {% include type t="Number" %}   | Opacity of axis ticks. {% include tag ver="4.1" %} |
| tickRound       | {% include type t="Boolean" %}  | Boolean flag indicating if pixel position values should be rounded to the nearest integer. |
| tickSize        | {% include type t="Number" %}   | Size, or length, in pixels of axis ticks. |
| tickWidth       | {% include type t="Number" %}   | Width in pixels of axis ticks. |
| titleAlign      | {% include type t="String" %}   | Horizontal text alignment of axis titles. |
| titleAngle      | {% include type t="Number" %}   | Angle in degrees of axis titles. |
| titleBaseline   | {% include type t="String" %}   | Vertical text baseline for axis titles. |
| titleColor      | {% include type t="Color" %}    | Text color of axis titles. |
| titleFont       | {% include type t="String" %}   | Font name for axis titles. |
| titleFontSize   | {% include type t="Number" %}   | Font size of axis titles. |
| titleFontWeight | {% include type t="String|Number" %}   | Font weight of axis titles. |
| titleLimit      | {% include type t="Number" %}   | The maximum allowed length in pixels of axis titles. |
| titleOpacity    | {% include type t="Number" %}   | Opacity of axis titles. {% include tag ver="4.1" %} |
| titlePadding    | {% include type t="Number" %}   | Padding in pixels between axis tick labels and titles. |
| titleX          | {% include type t="Number" %}   | X-coordinate of the axis title relative to the axis group. |
| titleY          | {% include type t="Number" %}   | Y-coordinate of the axis title relative to the axis group. |

### Usage

This example sets the axis label color to dark gray for all axes, and rotates the labels for axes oriented along the bottom of a chart.

```json
{
  "axis": {
    "labelColor": "#ccc"
  },
  "axisBottom": {
    "labelAngle": -90
  }
}
```

[Back to Top](#reference)


## <a name="legends"></a>Legend Properties

Properties defining default settings for legends. These properties are defined under the `"legend"` property within the config object.

| Property              | Type                            | Description    |
| :-------------------- | :-----------------------------: | :------------- |
| clipHeight            | {% include type t="Number" %}   | The height in pixels to clip symbol legend entries and limit their size. |
| columns               | {% include type t="Number" %}   | The number of columns in which to arrange symbol legend entries. A value of `0` or lower indicates a single row with one column per entry. |
| columnPadding         | {% include type t="Number" %}   | The horizontal padding in pixels between symbol legend entries. |
| cornerRadius          | {% include type t="Number" %}   | Corner radius for the full legend. |
| fillColor             | {% include type t="Color" %}    | Background fill color for the full legend. |
| gradientDirection     | {% include type t="String" %}   | The default direction (`"horizontal"` or `"vertical"`) for gradient legends. |
| gradientLength        | {% include type t="Number" %}   | The length in pixels of the primary axis of a color gradient. This value corresponds to the height of a vertical gradient or the width of a horizontal gradient. |
| gradientThickness     | {% include type t="Number" %}   | The thickness in pixels of the color gradient. This value corresponds to the width of a vertical gradient or the height of a horizontal gradient. |
| gradientWidth         | {% include type t="Number" %}   | Deprecated, use _gradientLength_ instead. If _gradientLength_ is not defined, this value will be used instead. |
| gradientHeight        | {% include type t="Number" %}   | Deprecated, use _gradientThickness_ instead. If _gradientThickness_ is not defined, this value will be used instead. |
| gradientStrokeColor   | {% include type t="Color" %}    | Stroke color for color ramp gradient borders. |
| gradientStrokeWidth   | {% include type t="Number" %}   | Stroke width for color ramp gradient borders. |
| gradientLabelLimit    | {% include type t="Number" %}   | The maximum allowed length in pixels of color ramp gradient labels. |
| gradientLabelOffset   | {% include type t="Number" %}   | Vertical offset in pixels for color ramp gradient labels. |
| gradientOpacity       | {% include type t="Number" %}   | Opacity of color ramp gradient. {% include tag ver="4.1" %} |
| gridAlign             | {% include type t="String" %}   | The alignment to apply to symbol legends rows and columns. The supported string values are `all`, `each` (the default), and `none`. For more information, see the [grid layout documentation](../layout). |
| labelAlign            | {% include type t="String" %}   | Horizontal text alignment for legend labels. |
| labelBaseline         | {% include type t="String" %}   | Vertical text baseline for legend labels. |
| labelColor            | {% include type t="Color" %}    | Text color for legend labels. |
| labelFont             | {% include type t="String" %}   | Font name for legend labels. |
| labelFontSize         | {% include type t="Number" %}   | Font size in pixels for legend labels. |
| labelFontWeight       | {% include type t="String|Number" %}   | Font weight of legend labels. |
| labelLimit            | {% include type t="Number" %}   | The maximum allowed length in pixels of legend labels. |
| labelOffset           | {% include type t="Number" %}   | Horizontal offset in pixels between legend symbols and labels. |
| labelOpacity          | {% include type t="Number" %}   | Opacity of legend labels. {% include tag ver="4.1" %} |
| labelOverlap          | {% include type t="Boolean|String" %} | The strategy to use for resolving overlap of labels in gradient legends. If `false`, no overlap reduction is attempted. If set to `true` (default) or `"parity"`, a strategy of removing every other label is used. If set to `"greedy"`, a linear scan of the labels is performed, removing any label that overlaps with the last visible label.|
| offset                | {% include type t="Number" %}   | Offset in pixels of the legend from the chart body. |
| orient                | {% include type t="String" %}   | Default legend orientation (e.g., `"right"` or `"left"`). |
| padding               | {% include type t="Number" %}   | Padding in pixels between legend border and contents. |
| rowPadding            | {% include type t="Number" %}   | The vertical padding in pixels between symbol legend entries. |
| strokeColor           | {% include type t="Color" %}    | Border stroke color for the full legend. |
| strokeDash            | {% include type t="Number[]" %} | Border stroke dash pattern for the full legend. |
| strokeWidth           | {% include type t="Number" %}   | Border stroke width for the full legend. |
| symbolBaseFillColor   | {% include type t="Color" %}    | Default fill color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend. |
| symbolBaseStrokeColor | {% include type t="Color" %}    | Default stroke color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend. |
| symbolDirection       | {% include type t="String" %}   | The default direction (`"horizontal"` or `"vertical"`) for symbol legends. |
| symbolFillColor       | {% include type t="Color" %}    | Fill color for legend symbols. |
| symbolOffset  | {% include type t="Number" %}   | Horizontal pixel offset for legend symbols. |
| symbolOpacity | {% include type t="Number" %}   | Opacity of legend symbols. {% include tag ver="4.1" %} |
| symbolSize            | {% include type t="Number" %}   | Default symbol area size (in pixels<sup>2</sup>). |
| symbolStrokeColor     | {% include type t="Color" %}    | Stroke color for legend symbols. |
| symbolStrokeWidth     | {% include type t="Number" %}   | Default legend symbol stroke width. |
| symbolType            | {% include type t="String" %}   | Default shape type (such as `"circle"`) for legend symbols. |
| titleAlign            | {% include type t="String" %}   | Horizontal text alignment for legend titles. |
| titleBaseline         | {% include type t="String" %}   | Vertical text baseline for legend titles. |
| titleColor            | {% include type t="Color" %}    | Text color for legend titles. |
| titleFont             | {% include type t="String" %}   | Font name for legend titles. |
| titleFontSize         | {% include type t="Number" %}   | Font size in pixels for legend titles. |
| titleFontWeight       | {% include type t="String|Number" %}   | Font weight for legend titles. |
| titleLimit            | {% include type t="Number" %}   | The maximum allowed length in pixels of legend titles. |
| titleOpacity          | {% include type t="Number" %}   | Opacity of legend titles. {% include tag ver="4.1" %} |
| titlePadding          | {% include type t="Number" %}   | Padding in pixels between the legend title and entries. |

### Usage

This example gives every legend a 10 pixel padding and a light gray border.

```json
{
  "legend": {
    "padding": 10,
    "legendStrokeColor": "#ccc",
    "legendStrokeWidth": 1
  }
}
```

[Back to Top](#reference)


## <a name="title"></a>Title Properties

Properties defining default settings for titles. These properties are defined under the `"title"` property within the config object.

| Property              | Type                            | Description    |
| :-------------------- | :-----------------------------: | :------------- |
| align                 | {% include type t="String" %}   | Horizontal text alignment of the title. If specified, this value overrides automatic alignment based on the _anchor_ value. |
| anchor                | {% include type t="String" %}   | Title anchor position (`"start"`, `"middle"`, or `"end"`). |
| angle                 | {% include type t="Number" %}   | Angle in degrees of title text. |
| baseline              | {% include type t="String" %}   | Vertical text baseline for title text. |
| color                 | {% include type t="Color" %}    | Text color for title text. |
| font                  | {% include type t="String" %}   | Font name for title text. |
| fontSize              | {% include type t="Number" %}   | Font size in pixels for title text. |
| fontWeight            | {% include type t="String|Number" %}   | Font weight for title text. |
| frame                 | {% include type t="String" %}   | The reference frame for the anchor position, one of `"bounds"` (to anchor relative to the full bounding box) or `"group"` (to anchor relative to the group width or height). |
| limit                 | {% include type t="Number" %}   | The maximum allowed length in pixels of legend labels. |
| offset                | {% include type t="Number" %}   | Offset in pixels of the title from the chart body and axes. |
| orient                | {% include type t="String" %}   | Default title orientation (`"top"`, `"bottom"`, `"left"`, or `"right"`). |

### Usage

This example gives every title a 10 pixel offset and a font size of 18 pixels.

```json
{
  "title": {
    "offset": 10,
    "fontSize": 18
  }
}
```

[Back to Top](#reference)


## <a name="scale-range"></a>Scale Range Properties

Properties defining named range arrays that can be used within scale range definitions (such as `{"type": "ordinal", "range": "category"}`). These properties are defined under the `"range"` property in the config object.

Object-valued properties must be legal [scale range](../scales/#range) definitions.

{% capture scheme %}[Scheme](../schemes){% include or %}{% include type t="Color[]" %}{% endcapture %}
| Property  | Type         | Description    |
| :-------- | :----------: | :------------- |
| category  | {{ scheme }} | Default [color scheme](../schemes) for categorical data. |
| diverging | {{ scheme }} | Default [color scheme](../schemes) for diverging quantitative ramps. |
| heatmap   | {{ scheme }} | Default [color scheme](../schemes) for quantitative heatmaps. |
| ordinal   | {{ scheme }} | Default [color scheme](../schemes) for rank-ordered data. |
| ramp      | {{ scheme }} | Default [color scheme](../schemes) for sequential quantitative ramps. |
| symbol    | {% include type t="String[]" %} | Array of [symbol](../marks/symbol) names or paths for the default shape palette. |


### Usage

This example sets new default color palettes.

```json
{
  "range": {
    "category": [
      "#5079a5",
      "#ef8e3b",
      "#dd565c",
      "#79b7b2",
      "#5da052",
      "#ecc853",
      "#ad7aa1",
      "#ef9ba7",
      "#9b7461",
      "#bab0ac"
    ],
    "ordinal": {"scheme": "greens"},
    "ramp": {"scheme": "purples"}
  }
}
```

[Back to Top](#reference)

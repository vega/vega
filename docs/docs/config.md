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
  "$schema": "https://vega.github.io/schema/vega/v3.0.json",
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
- [Mark Properties](#mark)
- [Axis Properties](#axes)
- [Legend Properties](#legends)
- [Title Properties](#title)
- [Scale Range Properties](#scale-range)
{: .column-list }

## <a name="view"></a>View Properties

Properties defined in the top-level scope of the configuration object.

| Property      | Type                                 | Description    |
| :------------ | :----------------------------------: | :------------- |
| autosize      | {% include type t="String|Object" %} | Default automatic sizing setting. Valid string values are `"pad"`, `"fit"` or `"none"`. See the [specification documentation](../specification) for more. |
| background    | {% include type t="Color" %}         | Background color of the view component, or `null` for transparent. |
| group         | {% include type t="Object" %}        | Default properties for the top-level group mark representing the data rectangle of a chart. Valid properties of this object are mark properties such as `"fill"`, `"stroke"` and `"strokeWidth"`. |

[Back to Top](#reference)

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

## <a name="mark"></a> Mark Properties

Properties defining default property values for each mark type. These properties are defined within blocks with names matching a valid mark type (e.g., `"area"`, `"line"`, `"rect"`). The valid properties within each block consist of the legal mark properties (e.g., `"fill"`, `"stroke"`, `"size"`, `"font"`). Global defaults for _all_ mark types can be set using the `"mark"` property.

_Defaults for fill or stroke color will be applied only if neither `"fill"` nor `"stroke"` are defined in the Vega spec_.

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


## <a name="axes"></a>Axis Properties

Properties defining default settings for axes. These properties are defined under the `"axis"` property in the config object, in which case the settings apply to _all_ axes.

Additional property blocks can target more specific axis types based on the orientation (`"axisX"`, `"axisY"`, `"axisLeft"`, `"axisTop"`, etc.) or band scale type (`"axisBand"`). For example, properties defined under the `"axisBand"` property will only apply to axes visualizing `"band"` scales. If multiple axis config blocks apply to a single axis, type-based options take precedence over orientation-based options, which in turn take precedence over general options.

| Property        | Type                            | Description    |
| :-------------- | :-----------------------------: | :------------- |
| bandPosition    | {% include type t="Number" %}   | An interpolation fraction indicating where, for `band` scales, axis ticks should be positioned. A value of `0` places ticks at the left edge of their bands. A value of `0.5` places ticks in the middle of their bands. |
| domain          | {% include type t="Boolean" %}  | Boolean flag indicating if axis domain line should be included by default. |
| domainColor     | {% include type t="Color" %}    | Color of axis domain line. |
| domainWidth     | {% include type t="Number" %}   | Stroke width of axis domain line. |
| grid            | {% include type t="Boolean" %}  | Boolean flag indicating if axis grid lines should be included by default. |
| gridColor       | {% include type t="Color" %}    | Color of axis grid lines. |
| gridDash        | {% include type t="Number[]" %} | Stroke dash of axis grid lines (or `[]` for solid lines). |
| gridOpacity     | {% include type t="Number" %}   | Opacity of axis grid lines. |
| gridWidth       | {% include type t="Number" %}   | Stroke width of axis grid lines. |
| labels          | {% include type t="Boolean" %}  | Boolean flag indicating if axis tick labels should be included by default. |
| labelAngle      | {% include type t="Number" %}   | Angle in degrees of axis tick labels. |
| labelColor      | {% include type t="Color" %}    | Text color of axis tick labels. |
| labelFont       | {% include type t="String" %}   | Font name for axis tick labels. |
| labelFontSize   | {% include type t="Number" %}   | Font size of axis tick labels. |
| labelLimit      | {% include type t="Number" %}   | The maximum allowed length in pixels of axis tick labels. |
| labelPadding    | {% include type t="Number" %}   | Padding in pixels betweem axis ticks and tick labels. |
| maxExtent       | {% include type t="Number" %}   | The maximum extent in pixels that axis ticks and labels should use. This determines a maximum offset value for axis titles. |
| minExtent       | {% include type t="Number" %}   | The minimum extent in pixels that axis ticks and labels should use. This determines a minimum offset value for axis titles. |
| ticks           | {% include type t="Boolean" %}  | Boolean flag indicating if axis tick marks should be included by default. |
| tickColor       | {% include type t="Color" %}    | Color of axis ticks. |
| tickExtra       | {% include type t="Boolean" %}  | Boolean flag indicating if an extra axis tick should be added for the initial position of the axis. This flag is useful for styling axes for `band` scales such that ticks are placed on band boundaries rather in the middle of a band. Use in conjunction with `"bandPostion": 1` and an axis `"padding"` value of `0`. |
| tickOffset      | {% include type t="Number" %}   | Position offset in pixels to apply to ticks, labels, and gridlines. |
| tickRound       | {% include type t="Boolean" %}  | Boolean flag indicating if pixel position values should be rounded to the nearest integer. |
| tickSize        | {% include type t="Number" %}   | Size, or length, in pixels of axis ticks. |
| tickWidth       | {% include type t="Number" %}   | Width in pixels of axis ticks. |
| titleAlign      | {% include type t="String" %}   | Horizontal text alignment of axis titles. |
| titleAngle      | {% include type t="Number" %}   | Angle in degrees of axis titles. |
| titleBaseline   | {% include type t="String" %}   | Vertical text baseline for axis titles. |
| titleColor      | {% include type t="Color" %}    | Text color of axis titles. |
| titleFont       | {% include type t="String" %}   | Font name for axis titles. |
| titleFontSize   | {% include type t="Number" %}   | Font size of axis titles. |
| titleFontWeight | {% include type t="String" %}   | Font weight of axis titles. |
| titleLimit      | {% include type t="Number" %}   | The maximum allowed length in pixels of axis titles. |
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
| cornerRadius          | {% include type t="Number" %}   | Corner radius for the full legend. |
| entryPadding          | {% include type t="Number" %}   | Padding in pixels between legend entries in a symbol legend. |
| fillColor             | {% include type t="Color" %}    | Background fill color for the full legend. |
| gradientWidth         | {% include type t="Number" %}   | Width in pixels of color ramp gradients. |
| gradientHeight        | {% include type t="Number" %}   | Height in pixels of color ramp gradients. |
| gradientStrokeColor   | {% include type t="Color" %}    | Stroke color for color ramp gradient borders. |
| gradientStrokeWidth   | {% include type t="Number" %}   | Stroke width for color ramp gradient borders. |
| gradientLabelBaseline | {% include type t="String" %}   | Text baseline for color ramp gradient labels. |
| gradientLabelLimit    | {% include type t="Number" %}   | The maximum allowed length in pixels of color ramp gradient labels. |
| gradientLabelOffset   | {% include type t="Number" %}   | Vertical offset in pixels for color ramp gradient labels. |
| labelAlign            | {% include type t="String" %}   | Horizontal text alignment for legend labels. |
| labelBaseline         | {% include type t="String" %}   | Vertical text baseline for legend labels. |
| labelColor            | {% include type t="Color" %}    | Text color for legend labels. |
| labelFont             | {% include type t="String" %}   | Font name for legend labels. |
| labelFontSize         | {% include type t="Number" %}   | Font size in pixels for legend labels. |
| labelLimit            | {% include type t="Number" %}   | The maximum allowed length in pixels of legend labels. |
| labelOffset           | {% include type t="Number" %}   | Horizontal offset in pixels between legend symbols and labels. |
| offset                | {% include type t="Number" %}   | Offset in pixels of the legend from the chart body. |
| orient                | {% include type t="String" %}   | Default legend orientation (e.g., `"right"` or `"left"`). |
| padding               | {% include type t="Number" %}   | Padding in pixels between legend border and contents. |
| titleAlign            | {% include type t="String" %}   | Horizontal text alignment for legend titles. |
| titleBaseline         | {% include type t="String" %}   | Vertical text baseline for legend titles. |
| titleColor            | {% include type t="Color" %}    | Text color for legend titles. |
| titleFont             | {% include type t="String" %}   | Font name for legend titles. |
| titleFontSize         | {% include type t="Number" %}   | Font size in pixels for legend titles. |
| titleFontWeight       | {% include type t="String" %}   | Font weight for legend titles. |
| titleLimit            | {% include type t="Number" %}   | The maximum allowed length in pixels of legend titles. |
| titlePadding          | {% include type t="Number" %}   | Padding in pixels between the legend title and entries. |
| strokeColor           | {% include type t="Color" %}    | Border stroke color for the full legend. |
| strokeDash            | {% include type t="Number[]" %} | Border stroke dash pattern for the full legend. |
| strokeWidth           | {% include type t="Number" %}   | Border stroke width for the full legend. |
| symbolType            | {% include type t="String" %}   | Default shape type (such as `"circle"`) for legend symbols. |
| symbolSize            | {% include type t="Number" %}   | Default symbol area size (in pixels<sup>2</sup>). |
| symbolColor           | {% include type t="Color" %}    | Default legend symbol color. |
| symbolStrokeWidth     | {% include type t="Number" %}   | Default legend symbol stroke width. |

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
| anchor                | {% include type t="String" %}   | Title anchor position (`"start"`, `"middle"`, or `"end"`). |
| angle                 | {% include type t="Number" %}   | Angle in degrees of title text. |
| baseline              | {% include type t="String" %}   | Vertical text baseline for title text. |
| color                 | {% include type t="Color" %}    | Text color for title text. |
| font                  | {% include type t="String" %}   | Font name for title text. |
| fontSize              | {% include type t="Number" %}   | Font size in pixels for title text. |
| fontWeight            | {% include type t="String" %}   | Font weight for title text. |
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

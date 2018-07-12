---
layout: spec
title: Legends
permalink: /docs/legends/index.html
---

**Legends** visualize scale mappings for visual values such as color, shape and size. Similar to scales and axes, legends can be defined either at the top-level visualization, or within the scope of a [group mark](../marks/group).


## Legend Properties

Properties for specifying a legend. Legends accept one or more [scales](../scales) as parameters. At least one of the _size_, _shape_, _fill_, _stroke_, _strokeDash_, or _opacity_ properties **must** be specified. If multiple scales are provided, they **must** share the _same domain_ of input vales. Otherwise, the behavior of the legend is undefined.

| Property      | Type                           | Description    |
| :------------ |:------------------------------:| :------------- |
| type          | {% include type t="String" %}  | The type of legend to include. One of `symbol` for discrete symbol legends, or `gradient` for a continuous color gradient. If `gradient` is used only the _fill_ or _stroke_ scale parameters are considered. If unspecified, the _type_ will be inferred based on the scale parameters used and their backing scale types.|
| direction     | {% include type t="String" %}  | The direction of the legend, one of `"vertical"` (default) or `"horizontal"`.|
| orient        | {% include type t="String" %}  | The orientation of the legend, determining where the legend is placed relative to a chart's data rectangle (default `right`). See the [legend orientation reference](#orientation).|
| fill          | {% include type t="String" %}  | The name of a scale that maps to a fill color.|
| opacity       | {% include type t="String" %}  | The name of a scale that maps to an opacity value.|
| shape         | {% include type t="String" %}  | The name of a scale that maps to a shape value.|
| size          | {% include type t="String" %}  | The name of a scale that maps to a size (area) value.|
| stroke        | {% include type t="String" %}  | The name of a scale that maps to a stroke color.|
| strokeDash    | {% include type t="String" %}  | The name of a scale that maps to a stroke dash value.|
| encode        | {% include type t="Object" %}  | Optional mark encodings for custom legend styling. Supports encoding blocks for `legend`, `title`, `entries`, `labels`, `symbols` and `gradient`. See [custom legend encodings](#custom). |
| format        | {% include type t="String" %}  | The format specifier pattern for legend labels. For numerical values, must be a legal [d3-format](https://github.com/d3/d3-format#locale_format) specifier. For date-time values,  must be a legal [d3-time-format](https://github.com/d3/d3-time-format#locale_format) specifier.|
| gridAlign     | {% include type t="String" %}  | The alignment to apply to symbol legends rows and columns. The supported string values are `all`, `each` (the default), and `none`. For more information, see the [grid layout documentation](../layout). |
| clipHeight    | {% include type t="Number" %}  | The height in pixels to clip symbol legend entries and limit their size. By default no clipping is performed. |
| columns       | {% include type t="Number" %}  | The number of columns in which to arrange symbol legend entries. A value of `0` or lower indicates a single row with one column per entry. The default is `0` for horizontal symbol legends and `1` for vertical symbol legends. |
| columnPadding | {% include type t="Number" %}  | The horizontal padding in pixels between symbol legend entries. |
| rowPadding    | {% include type t="Number" %}  | The vertical padding in pixels between symbol legend entries. |
| cornerRadius  | {% include type t="Number" %}  | Corner radius for the full legend. |
| fillColor     | {% include type t="Color" %}   | Background fill color for the full legend. |
| offset        | {% include type t="Number|Value" %} | The offset in pixels by which to displace the legend from the data rectangle and axes.|
| padding       | {% include type t="Number|Value" %} | The padding between the border and content of the legend group.|
| strokeColor   | {% include type t="Color" %}   | Border stroke color for the full legend. |
| strokeWidth   | {% include type t="Number" %}  | Border stroke width for the full legend. |
| gradientLength      | {% include type t="Number" %} | The length in pixels of the primary axis of a color gradient. This value corresponds to the height of a vertical gradient or the width of a horizontal gradient. |
| gradientOpacity     | {% include type t="Number" %}  | Opacity of the color gradient. {% include tag ver="4.1" %} |
| gradientThickness   | {% include type t="Number" %} | The thickness in pixels of the color gradient. This value corresponds to the width of a vertical gradient or the height of a horizontal gradient. |
| gradientStrokeColor | {% include type t="Color" %}  | Stroke color of the color gradient border. |
| gradientStrokeWidth | {% include type t="Number" %} | Stroke width of the color gradient border. |
| labelAlign    | {% include type t="String" %}  | Horizontal text alignment for legend labels. |
| labelBaseline | {% include type t="String" %}  | Vertical text baseline for legend labels. |
| labelColor    | {% include type t="Color" %}   | Text color for legend labels. |
| labelFont     | {% include type t="String" %}  | Font name for legend labels. |
| labelFontSize | {% include type t="Number" %}  | Font size in pixels for legend labels. |
| labelFontWeight | {% include type t="String|Number" %} | Font weight of legend labels. |
| labelLimit    | {% include type t="Number" %}  | The maximum allowed length in pixels of legend labels. |
| labelOffset   | {% include type t="Number" %}  | Offset in pixels between legend labels their corresponding symbol or gradient. |
| labelOpacity  | {% include type t="Number" %}  | Opacity of legend labels. {% include tag ver="4.1" %} |
| labelOverlap  | {% include type t="Boolean|String" %} | The strategy to use for resolving overlap of labels in gradient legends. If `false`, no overlap reduction is attempted. If set to `true` (default) or `"parity"`, a strategy of removing every other label is used. If set to `"greedy"`, a linear scan of the labels is performed, removing any label that overlaps with the last visible label.|
| symbolFillColor | {% include type t="Color" %}  | Fill color for legend symbols. |
| symbolOffset  | {% include type t="Number" %}   | Horizontal pixel offset for legend symbols. |
| symbolOpacity | {% include type t="Number" %}  | Opacity of legend symbols. {% include tag ver="4.1" %} |
| symbolSize    | {% include type t="Number" %}   | Default symbol area size (in pixels<sup>2</sup>). |
| symbolStrokeColor | {% include type t="Color" %}  | Stroke color for legend symbols. |
| symbolStrokeWidth | {% include type t="Number" %} | Default legend symbol stroke width. |
| symbolType    | {% include type t="String" %}   | Default shape type (such as `"circle"`) for legend symbols. |
| tickCount     | {% include type t="Number|String|Object" %}  | The desired number of tick values for quantitative legends. For scales of type `time` or `utc`, the tick count can instead be a time interval specifier. Legal string values are `"millisecond"`, `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, and `"year"`. Alternatively, an object-valued interval specifier of the form `{"interval": "month", "step": 3}` includes a desired number of interval steps. Here, ticks are generated for each quarter (Jan, Apr, Jul, Oct) boundary.|
| title         | {% include type t="String" %}  | The title for the legend (none by default).|
| titleAlign    | {% include type t="String" %}  | Horizontal text alignment for legend title. |
| titleBaseline | {% include type t="String" %}  | Vertical text baseline for legend title. |
| titleColor    | {% include type t="Color" %}   | Text color for legend title. |
| titleFont     | {% include type t="String" %}  | Font name for legend title. |
| titleFontSize | {% include type t="Number" %}  | Font size in pixels for legend title. |
| titleFontWeight | {% include type t="String|Number" %} | Font weight for legend title. |
| titleLimit    | {% include type t="Number" %} | The maximum allowed length in pixels of the legend title. |
| titleOpacity  | {% include type t="Number" %}  | Opacity of the legend title. {% include tag ver="4.1" %} |
| titlePadding  | {% include type t="Number|Value" %} | The padding between the legend title and entries.|
| values        | {% include type t="Array" %}   | Explicitly set the visible legend values.|
| zindex        | {% include type t="Number" %}  | The integer z-index indicating the layering of the legend group relative to other axis, mark and legend groups. The default value is `0`.|

To create themes, new default values for many legend properties can be set using a [config](../config) object.


## <a name="orientation"></a>Legend Orientation Reference

Valid settings for the legend _orient_ parameter.

| Value          | Description |
| :------------- | :---------- |
| `left`         | Place the legend to the left of the chart. |
| `right`        | Place the legend to the right of the chart. |
| `top`          | Place the legend above the top of the chart. |
| `bottom`       | Place the legend below the bottom of the chart. |
| `top-left`     | Place the legend inside the upper left corner of the chart.|
| `top-right`    | Place the legend inside the upper right corner of the chart.|
| `bottom-left`  | Place the legend inside the lower left corner of the chart.|
| `bottom-right` | Place the legend inside the lower right corner of the chart.|
| `none`         | Do not perform automatic layout. Allows custom layout by setting the `x` and `y` properties within a `legend` encoding block.|

_Multiple legends_: If multiple legends have a `left` or `right` orientation, they will be vertically ordered. If multiple legends have a `top` or `bottom` orientation, they will be horizontally ordered. In all other cases, legends will be drawn on top of each other when placed in the same location.

_Legend offset_: In the case of `left`, `right`, `top` and `bottom` orientation, the _offset_ parameter determines how far away the legend is placed from the rest of the chart. If the orientation is `none`, the _offset_ parameter is ignored. For all other settings, the _offset_ determines the distance the legend is moved inward from a corner of the data rectangle.


## <a name="custom"></a>Custom Legend Encodings

Custom mark properties can be set for all legend elements using the _encode_ parameter. The addressable elements are:

- `legend` for the legend [group](../marks/group) mark,
- `title` for the title [text](../marks/text) mark,
- `labels` for label [text](../marks/text) marks,
- `symbols` for legend [symbol](../marks/symbol) marks,
- `entries` for symbol legend [group](../marks/group) marks containing a symbol / label pair, and
- `gradient` for a gradient [rect](../marks/rect) marks: one rect with gradient fill for continuous gradient legends, multiple rect marks with solid fill for discrete gradient legends.

Each element accepts a set of visual encoding directives grouped into `enter`, `update`, `exit`, _etc._ objects as described in the [Marks](../marks) documentation. Mark properties can be styled using standard [value references](../types/#Value).

In addition, each encode block may include a string-valued `name` property to assign a unique name to the mark set, a boolean-valued `interactive` property to enable input event handling, and a string-valued (or array-valued) `style` property to apply default property values. Unless otherwise specified, title elements use a default style of `"guide-title"` and labels elements use a default style of `"guide-label"`.

Each legend symbol and label instance is backed by a data object with the following fields, which may be accessed as part of a custom visual encoding rule:

- `index` - an integer index
- `label` - the string label
- `value` - the data value
- `size` - the symbol size (for symbol legends only)

The following example shows how to set custom fonts and a border on a legend for a fill color encoding. The `labels` encoding block also make legend labels responsive to input events, and changes the text color on mouse hover.

{: .suppress-error}
```json
"legends": [
  {
    "fill": "color",
    "encode": {
      "title": {
        "update": {
          "fontSize": {"value": 14}
        }
      },
      "labels": {
        "interactive": true,
        "update": {
          "fontSize": {"value": 12},
          "fill": {"value": "black"}
        },
        "hover": {
          "fill": {"value": "firebrick"}
        }
      },
      "symbols": {
        "update": {
          "stroke": {"value": "transparent"}
        }
      },
      "legend": {
        "update": {
          "stroke": {"value": "#ccc"},
          "strokeWidth": {"value": 1.5}
        }
      }
    }
  }
]
```

Custom text can be defined using the `text` property for `labels`. For example, one could define an ordinal scale that serves as a lookup table from a backing `value` to legend label text. In addition, one can set the `x` and `y` properties for the `legend` to perform custom positioning when _orient_ is `none`.

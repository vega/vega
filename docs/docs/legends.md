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
| orient        | {% include type t="String" %}  | The orientation of the legend, determining where the legend is placed relative to a chart's data rectangle (default `right`). See the [legend orientation reference](#orientation). |
| fill          | {% include type t="String" %}  | The name of a scale that maps to a fill color. |
| opacity       | {% include type t="String" %}  | The name of a scale that maps to an opacity value. |
| shape         | {% include type t="String" %}  | The name of a scale that maps to a shape value. |
| size          | {% include type t="String" %}  | The name of a scale that maps to a size (area) value. |
| stroke        | {% include type t="String" %}  | The name of a scale that maps to a stroke color. |
| strokeDash    | {% include type t="String" %}  | The name of a scale that maps to a stroke dash value. |
| strokeWidth   | {% include type t="String" %}  | The name of a scale that maps to a stroke width value. {% include tag ver="5.0" %} |
| encode        | {% include type t="Object" %}  | Optional mark encodings for custom legend styling. Supports encoding blocks for `legend`, `title`, `entries`, `labels`, `symbols` and `gradient`. See [custom legend encodings](#custom). |
| format        | {% include type t="String|TimeMultiFormat" %}  | The format specifier pattern for legend labels. For numerical values, must be a legal [d3-format](https://github.com/d3/d3-format#locale_format) specifier. For date-time values, must be a legal [d3-time-format](https://github.com/d3/d3-time-format#locale_format) specifier or a [TimeMultiFormat object](../types/#TimeMultiFormat). |
| formatType    | {% include type t="String" %}  | Specifies the type of format to use (`"number"`, `"time"`, `"utc"`) for scales that do not have a strict domain data type. This property is useful for formatting date-time values for ordinal scales. If specified, the *format* property must have a valid specifier pattern for the given type. Supported {% include tag ver="5.1" %}, UTC support {% include tag ver="5.8" %}. |
| gridAlign     | {% include type t="String" %}  | The alignment to apply to symbol legends rows and columns. The supported string values are `all`, `each` (the default), and `none`. For more information, see the [grid layout documentation](../layout). |
| clipHeight    | {% include type t="Number" %}  | The height in pixels to clip symbol legend entries and limit their size. By default no clipping is performed. |
| columns       | {% include type t="Number" %}  | The number of columns in which to arrange symbol legend entries. A value of `0` or lower indicates a single row with one column per entry. The default is `0` for horizontal symbol legends and `1` for vertical symbol legends. |
| columnPadding | {% include type t="Number" %}  | The horizontal padding in pixels between symbol legend entries. |
| rowPadding    | {% include type t="Number" %}  | The vertical padding in pixels between symbol legend entries. |
| cornerRadius  | {% include type t="Number" %}  | Corner radius for the full legend. |
| fillColor     | {% include type t="Color" %}   | Background fill color for the full legend. |
| offset        | {% include type t="Number|Value" %} | The offset in pixels by which to displace the legend from the data rectangle and axes. If provided, this value will override any values specified in the [legend config](../config/#legends). If multiple *offset* values are specified for a collection of legends with the same *orient* value, the maximum *offset* will be used.|
| padding       | {% include type t="Number|Value" %} | The padding between the border and content of the legend group.|
| strokeColor   | {% include type t="Color" %}   | Border stroke color for the full legend. |
| gradientLength      | {% include type t="Number" %} | The length in pixels of the primary axis of a color gradient. This value corresponds to the height of a vertical gradient or the width of a horizontal gradient. |
| gradientOpacity     | {% include type t="Number" %}  | Opacity of the color gradient. {% include tag ver="4.1" %} |
| gradientThickness   | {% include type t="Number" %} | The thickness in pixels of the color gradient. This value corresponds to the width of a vertical gradient or the height of a horizontal gradient. |
| gradientStrokeColor | {% include type t="Color" %}  | Stroke color of the color gradient border. |
| gradientStrokeWidth | {% include type t="Number" %} | Stroke width of the color gradient border. |
| labelAlign    | {% include type t="String" %}  | Horizontal text alignment for legend labels. |
| labelBaseline | {% include type t="String" %}  | Vertical text baseline for legend labels. One of `alphabetic` (default), `top`, `middle`, `bottom`, `line-top`, or `line-bottom`. The `line-top` and `line-bottom` values {% include tag ver="5.10" %} operate similarly to `top` and `bottom`, but are calculated relative to the *lineHeight* rather than *fontSize* alone. |
| labelColor    | {% include type t="Color" %}   | Text color for legend labels. |
| labelFont     | {% include type t="String" %}  | Font name for legend labels. |
| labelFontSize | {% include type t="Number" %}  | Font size in pixels for legend labels. |
| labelFontStyle  | {% include type t="String" %} | Font style of legend labels (e.g., `normal` or `italic`). {% include tag ver="5.0" %} |
| labelFontWeight | {% include type t="String|Number" %} | Font weight of legend labels. |
| labelLimit    | {% include type t="Number" %}  | The maximum allowed length in pixels of legend labels. |
| labelOffset   | {% include type t="Number" %}  | Offset in pixels between legend labels their corresponding symbol or gradient. |
| labelOpacity  | {% include type t="Number" %}  | Opacity of legend labels. {% include tag ver="4.1" %} |
| labelOverlap  | {% include type t="Boolean|String" %} | The strategy to use for resolving overlap of labels in gradient legends. If `false`, no overlap reduction is attempted. If set to `true` (default) or `"parity"`, a strategy of removing every other label is used. If set to `"greedy"`, a linear scan of the labels is performed, removing any label that overlaps with the last visible label.|
|labelSeparation| {% include type t="Number" %}  | The minimum separation that must be between label bounding boxes for them to be considered non-overlapping (default `0`). This property is ignored if *labelOverlap* resolution is not enabled. {% include tag ver="5.0" %} |
| legendX       | {% include type t="Number" %}  | The pixel x-coordinate of the legend group. Only applied if the _orient_ value is `"none"`. {% include tag ver="5.4" %} |
| legendY       | {% include type t="Number" %}  | The pixel y-coordinate of the legend group. Only applied if the _orient_ value is `"none"`. {% include tag ver="5.4" %} |
| symbolDash      | {% include type t="Number[]" %} | Stroke dash of symbol outlines (or `[]` for solid lines). {% include tag ver="5.0" %} |
| symbolDashOffset| {% include type t="Number" %}   | The pixel offset at which to start the symbol dash array. {% include tag ver="5.0" %} |
| symbolFillColor | {% include type t="Color" %}  | Fill color for legend symbols. |
| symbolLimit     | {% include type t="Number" %} | The maximum number of allowed entries for a symbol legend. If the number of entries exceeds the limit, entries will be dropped and replaced with an ellipsis. {% include tag ver="5.7" %} |
| symbolOffset  | {% include type t="Number" %}   | Horizontal pixel offset for legend symbols. |
| symbolOpacity | {% include type t="Number" %}  | Opacity of legend symbols. {% include tag ver="4.1" %} |
| symbolSize    | {% include type t="Number" %}   | Default symbol area size (in pixels<sup>2</sup>). |
| symbolStrokeColor | {% include type t="Color" %}  | Stroke color for legend symbols. |
| symbolStrokeWidth | {% include type t="Number" %} | Default legend symbol stroke width. |
| symbolType    | {% include type t="String" %}   | Default [symbol mark shape type](../marks/symbol/) (such as `"circle"`) for legend symbols. |
| tickCount     | {% include type t="Number|String|Object" %}  | The desired number of tick values for quantitative legends. For scales of type `time` or `utc`, the tick count can instead be a time interval specifier. Legal string values are `"millisecond"`, `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, and `"year"`. Alternatively, an object-valued interval specifier of the form `{"interval": "month", "step": 3}` includes a desired number of interval steps. Here, ticks are generated for each quarter (Jan, Apr, Jul, Oct) boundary.|
| tickMinStep   | {% include type t="Number" %}  | The minimum desired step between tick values for quantitative legends, in terms of scale domain values. For example, a value of `1` indicates that ticks should not be less than 1 unit apart. If `tickMinStep` is specified, the `tickCount` value will be adjusted, if necessary, to enforce the minimum step value. {% include tag ver="5.0" %} |
| title         | {% include type t="String|String[]" %}  | The title for the legend (none by default). For versions {% include tag ver="5.7" %}, a string array specifies a title with multiple lines of text.|
| titleAnchor   | {% include type t="String" %}  | The anchor position for placing the legend title. One of `"start"`, `"middle"`, `"end"`, or `null` (default, for automatic determination). For example, with a _titleOrient_ of `"top"` these anchor positions map to a left-, center-, or right-aligned title relative to the legend contents. {% include tag ver="5.0" %} |
| titleAlign    | {% include type t="String" %}  | Horizontal text alignment of the legend title. One of `"left"`, `"center"`, or `"right"`. If specified, this value overrides automatic alignment based on the _titleOrient_ and _titleAnchor_ values. |
| titleBaseline | {% include type t="String" %}  | Vertical text baseline of the legend title. One of `alphabetic` (default), `top`, `middle`, `bottom`, `line-top`, or `line-bottom`. The `line-top` and `line-bottom` values {% include tag ver="5.10" %} operate similarly to `top` and `bottom`, but are calculated relative to the *lineHeight* rather than *fontSize* alone. If specified, this value overrides the automatic baseline based on the _titleOrient_ and _titleAnchor_ values. |
| titleColor    | {% include type t="Color" %}   | Text color of the legend title. |
| titleFont     | {% include type t="String" %}  | Font name of the legend title. |
| titleFontSize | {% include type t="Number" %}  | Font size in pixels of the legend title. |
| titleFontStyle  | {% include type t="String" %} | Font style of the legend title (e.g., `normal` or `italic`). {% include tag ver="5.0" %} |
| titleFontWeight | {% include type t="String|Number" %} | Font weight of the legend title. |
| titleLimit    | {% include type t="Number" %} | The maximum allowed length in pixels of the legend title. |
| titleLineHeight | {% include type t="Number" %} | Line height in pixels for multi-line title text or title text with `"line-top"` or `"line-bottom"` baseline. {% include tag ver="5.7" %} |
| titleOpacity  | {% include type t="Number" %}  | Opacity of the legend title. {% include tag ver="4.1" %} |
| titleOrient   | {% include type t="String" %}  | The orientation of the title legend, determining where it is placed relative to the legend contents. One of `"top"` (default), `"left"`, `"bottom"`, or `"right"`. {% include tag ver="5.0" %} |
| titlePadding  | {% include type t="Number|Value" %} | The padding between the legend title and entries.|
| values        | {% include type t="Array" %}   | Explicitly set the visible legend values. The array entries should be legal values in the backing scale domain.|
| zindex        | {% include type t="Number" %}  | The integer z-index indicating the layering of the legend group relative to other axis, mark, and legend groups. The default value is `0`.|

### Accessibility Properties {% include tag ver="5.11" %}

Accessibility properties are used to determine [ARIA (Accessible Rich Internet Applications) attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) when using Vega to render SVG output.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| aria          | {% include type t="Boolean" %} | A boolean flag (default `true`) indicating if ARIA attributes should be included (SVG output only). If `false`, the "aria-hidden" attribute will be set on the output SVG group, removing the legend from the ARIA accessibility tree. |
| description   | {% include type t="String" %}  | A text description of this legend for ARIA accessibility (SVG output only). If the *aria* property is `true`, for SVG output the ["aria-label" attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute) will be set to this description. If the description is unspecified it will be automatically generated. |

### Themes and Configuration

To create themes, new default values for legend properties can be set using a [config](../config/#legends) object. The config object also supports [customized layout](../config/#legends-layout) behavior for collections of legends with the same *orient* value.


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
| `none`         | Do not perform automatic layout. Allows custom layout by setting the *legendX* and *legendY* properties of the legend.|

_Multiple legends_: If multiple legends have a `left` or `right` orientation, they will be vertically ordered by default. If multiple legends have a `top` or `bottom` orientation, they will be horizontally ordered by default. In all other cases, legends will be drawn on top of each other when placed in the same location. The multiple legend layout can be customized by setting the [legend layout config](../config/#legends-layout).

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

Custom text can be defined using the `text` property for `labels`. For example, one could define an ordinal scale that serves as a lookup table from a backing `value` to legend label text. Note: to perform custom positioning when _orient_ is `none`, use the top-level *legendX* and *legendY* properties, do not use `x` and `y` properties within a custom encoding block.

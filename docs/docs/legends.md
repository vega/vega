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
| type          | {% include type t="String" %}  | The type of legend to include. One of `symbol` (the default) for discrete symbol legends, or `gradient` for a continuous color gradient. If `gradient` is used only the _fill_ or _stroke_ scale parameters are considered.|
| orient        | {% include type t="String" %}  | The orientation of the legend, determining where the legend is placed relative to a chart's data rectangle (default `right`). See the [legend orientation reference](#orientation).|
| fill          | {% include type t="String" %}  | The name of a scale that maps to a fill color.|
| opacity       | {% include type t="String" %}  | The name of a scale that maps to an opacity value.|
| shape         | {% include type t="String" %}  | The name of a scale that maps to a shape value.|
| size          | {% include type t="String" %}  | The name of a scale that maps to a size (area) value.|
| stroke        | {% include type t="String" %}  | The name of a scale that maps to a stroke color.|
| strokeDash    | {% include type t="String" %}  | The name of a scale that maps to a stroke dash value.|
| encode        | {% include type t="Object" %}  | Optional mark encodings for custom legend styling. Supports encoding blocks for `legend`, `title`, `labels`, `symbols` and `gradient`. See [custom legend encodings](#custom). |
| entryPadding  | {% include type t="Number|Value" %} | The padding between entries in a symbol legend.|
| format        | {% include type t="String" %}  | The format specifier pattern for legend labels. For numerical values, must be a legal [d3-format](https://github.com/d3/d3-format#locale_format) specifier. For date-time values,  must be a legal [d3-time-format](https://github.com/d3/d3-time-format#locale_format) specifier.|
| offset        | {% include type t="Number|Value" %} | The offset in pixels by which to displace the legend from the data rectangle and axes.|
| padding       | {% include type t="Number|Value" %} | The padding between the border and content of the legend group.|
| tickCount     | {% include type t="Number" %}  | The desired number of tick values for quantitative legends.|
| titlePadding  | {% include type t="Number|Value" %} | The padding between the legend title and entries.|
| title         | {% include type t="String" %}  | The title for the legend (none by default).|
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

_Multiple legends_: If multiple legends have a `left` or `right` orientation, they will be vertically ordered. If multiple legends have a `top` or `bottom` orientation, they will be horiztonally ordered. In all other cases, legends will be drawn on top of each other when placed in the same location.

_Legend offset_: In the case of `left`, `right`, `top` and `bottom` orientation, the _offset_ parameter determines how far away the legend is placed from the rest of the chart. If the orientation is `none`, the _offset_ parameter is ignored. For all other settings, the _offset_ determines the distance the legend is moved inward from a corner of the data rectangle.


## <a name="custom"></a>Custom Legend Encodings

Custom mark properties can be set for all legend elements using the _encode_ parameter. The addressable elements are:

- `legend` for the legend [group](../marks/group) mark,
- `title` for the title [text](../marks/text) mark,
- `labels` for label [text](../marks/text) marks,
- `symbols` for legend [symbol](../marks/symbol) marks, and
- `gradient` for a gradient-filled [rect](../marks/rect) mark.

Each element accepts a set of visual encoding directives grouped into `enter`, `update`, `exit`, _etc._ objects as described in the [Marks](../marks) documentation. Mark properties can be styled using standard [value references](../types/#Value). In addition, each encode block may include a string-valued `name` property to assign a unique name to the mark set, and a boolean-valued `interactive` property to enable input event handling.

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

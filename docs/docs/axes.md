---
layout: spec
title: Axes
permalink: /docs/axes/index.html
---

**Axes** visualize spatial [scale](../scales) mappings using ticks, grid lines and labels. Vega currently supports axes for Cartesian (rectangular) coordinates. Similar to scales, axes can be defined either at the top-level of the specification, or as part of a [group mark](../marks/group).

## Axis Properties

Properties for specifying a coordinate axis.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| scale         | {% include type t="String" %}  | {% include required %} The name of the scale backing the axis component.|
| orient        | {% include type t="String" %}  | {% include required %} The orientation of the axis. See the [axis orientation reference](#orientation).|
| domain        | {% include type t="Boolean" %} | A boolean flag indicating if the domain (the axis baseline) should be included as part of the axis (default `true`).|
| encode        | {% include type t="Object" %}  | Optional mark encodings for custom axis styling. Supports encoding blocks for `axis`, `ticks`, `labels`, `grid`, and `domain`. See [custom axis encodings](#custom).|
| format        | {% include type t="String" %}  | The format specifier pattern for axis labels. For numerical values, must be a legal [d3-format](https://github.com/d3/d3-format#locale_format) specifier. For date-time values, must be a legal [d3-time-format](https://github.com/d3/d3-time-format#locale_format) specifier.|
| grid          | {% include type t="Boolean" %} | A boolean flag indicating if grid lines should be included as part of the axis (default `false`).|
| gridScale     | {% include type t="String" %}  | The name of the scale to use for including grid lines. By default grid lines are driven by the same scale as the ticks and labels.|
| labels        | {% include type t="Boolean" %} | A boolean flag indicating if labels should be included as part of the axis (default `true`).|
| labelPadding  | {% include type t="Number" %}  | The padding in pixels between labels and ticks.|
| labelOverlap  | {% include type t="Boolean|String" %}  | The strategy to use for resolving overlap of axis labels. If `false` (the default), no overlap reduction is attempted. If set to `true` or `"parity"`, a strategy of removing every other label is used (this works well for standard linear axes). If set to `"greedy"`, a linear scan of the labels is performed, removing any labels that overlaps with the last visible label (this often works better for log-scaled axes).|
| minExtent     | {% include type t="Number|Value" %} | The minimum extent in pixels that axis ticks and labels should use. This determines a minimum offset value for axis titles.|
| maxExtent     | {% include type t="Number|Value" %} | The maximum extent in pixels that axis ticks and labels should use. This determines a maximum offset value for axis titles.|
| offset        | {% include type t="Number|Value" %} | The orthogonal offset in pixels by which to displace the axis from its position along the edge of the chart.|
| position      | {% include type t="Number|Value" %} | The anchor position of the axis in pixels (default `0`). For x-axes with top or bottom orientation, this sets the axis group `x` coordinate. For y-axes with left or right orientation, this sets the axis group `y` coordinate.|
| ticks         | {% include type t="Boolean" %} | A boolean flag indicating if ticks should be included as part of the axis (default `true`).|
| tickCount     | {% include type t="Number" %}  | A desired number of ticks, for axes visualizing quantitative scales. The resulting number may be different so that values are "nice" (multiples of 2, 5, 10) and lie within the underlying scale's range.|
| tickSize      | {% include type t="Number" %}  | The size in pixels of axis ticks.|
| title         | {% include type t="String" %}  | A title for the axis (none by default).|
| titlePadding  | {% include type t="Number|Value" %} | The offset in pixels between the axis labels and axis title.|
| values        | {% include type t="Array" %}   | Explicitly set the visible axis tick and label values.|
| zindex        | {% include type t="Number" %}  | The integer z-index indicating the layering of the axis group relative to other axis, mark and legend groups. The default value is `0` and axes and grid lines are drawn _behind_ any marks defined in the same specification level. Higher values (`1`) will cause axes and grid lines to be drawn on top of marks.|

To create themes, new default values for many axis properties can be set using a [config](../config) object.


## <a name="orientation"></a>Axis Orientation Reference

Valid settings for the axis _orient_ parameter.

| Value          | Description |
| :------------- | :---------- |
| `left`         | Place a y-axis along the left edge of the chart.|
| `right`        | Place a y-axis along the right edge of the chart.|
| `top`          | Place an x-axis along the top edge of the chart.|
| `bottom`       | Place an x-axis along the bottom edge of the chart.|


## <a name="custom"></a>Custom Axis Encodings

Custom mark properties can be set for all axis elements using the _encode_ parameter. The addressable elements are:

- `axis` for the axis [group](../marks/group) mark,
- `ticks` for tick [rule](../mark/rule) marks,
- `grid` for gridline [rule](../mark/rule) marks,
- `labels` for label [text](../marks/text) marks,
- `title` for the title [text](../marks/text) mark, and
- `domain` for the axis domain [rule](../marks/rule) mark.

Each element accepts a set of visual encoding directives grouped into `enter`, `update`, `exit`, _etc._ objects as described in the [Marks](../marks) documentation. Mark properties can be styled using standard [value references](../types/#Value). In addition, each encode block may include a string-valued `name` property to assign a unique name to the mark set, and a boolean-valued `interactive` property to enable input event handling.

Each axis tick, grid line, and label instance is backed by a data object with the following fields, which may be accessed as part of a custom visual encoding rule.

- `label` - the string label
- `value` - the data value

The following example shows how to set custom colors, thickness, text angle, and fonts. The `labels` encoding block also make legend labels reponsive to input events, and changes the text color on mouse hover.

{: .suppress-error}
```json
"axes": [
  {
    "orient": "bottom",
    "scale": "x",
    "title": "X-Axis",
    "encode": {
      "ticks": {
        "update": {
          "stroke": {"value": "steelblue"}
        }
      },
      "labels": {
        "interactive": true,
        "update": {
          "text": {"signal": "format(datum.value, '+,')"},
          "fill": {"value": "steelblue"},
          "angle": {"value": 50},
          "fontSize": {"value": 14},
          "align": {"value": "left"},
          "baseline": {"value": "middle"},
          "dx": {"value": 3}
        },
        "hover": {
          "fill": {"value": "firebrick"}
        }
      },
      "title": {
        "update": {
          "fontSize": {"value": 16}
        }
      },
      "domain": {
        "update": {
          "stroke": {"value": "#333"},
          "strokeWidth": {"value": 1.5}
        }
      }
    }
  }
]
```

Custom text can be defined using the `"text"` property for `labels`. For example, one could define an ordinal scale that serves as a lookup table from axis values to axis label text.

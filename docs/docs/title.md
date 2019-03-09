---
layout: spec
title: Title
permalink: /docs/title/index.html
---

The **title** directive adds a descriptive title to a chart. Similar to scales, axes, and legends, a title can be defined at the top-level of a specification or as part of a [group mark](../marks/group).

## Title Properties

Properties for specifying a title.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| text          | {% include type t="String" %}  | {% include required %} The title text.|
| orient        | {% include type t="String" %}  | The orientation of the title relative to the chart. One of `top` (the default), `bottom`, `left`, or `right`.|
| align         | {% include type t="String" %}  | Horizontal text alignment of the title. If specified, this value overrides automatic alignment based on the _anchor_ value. |
| anchor        | {% include type t="String" %}  | The anchor position for placing the title. One of `start`, `middle` (the default), or `end`. For example, with an orientation of `top` these anchor positions map to a left-, center-, or right-aligned title.|
| angle         | {% include type t="Number" %}  | Angle in degrees of the title text. |
| baseline      | {% include type t="String" %}  | Vertical baseline of the title text. |
| color         | {% include type t="Color" %}   | Text color of the title text. |
| dx            | {% include type t="Number" %}  | Horizontal offset added to the title x-coordinate. {% include tag ver="5.2" %} |
| dy            | {% include type t="Number" %}  | Vertical offset added to the title y-coordinate. {% include tag ver="5.2" %} |
| encode        | {% include type t="Object" %}  | Optional mark encodings for custom title styling. This is a standard encode block for text marks, and may contain `enter`, `exit`, `update`, and `hover` property sets. To set a custom font, font size, _etc._ for a title, one can either use custom encode blocks or update the title [config](../config).|
| font          | {% include type t="String" %}  | Font name of the title text. |
| fontSize      | {% include type t="Number" %}  | Font size in pixels of the title text. |
| fontStyle     | {% include type t="String" %}  | Font style of the title text (e.g., `normal` or `italic`). {% include tag ver="5.0" %} |
| fontWeight    | {% include type t="String|Number" %}  | Font weight of the title text. |
| frame         | {% include type t="String" %}  | The reference frame for the anchor position, one of `"bounds"` (the default, to anchor relative to the full bounding box) or `"group"` (to anchor relative to the group width or height). |
| interactive   | {% include type t="Boolean" %} | A boolean flag indicating if the title element should respond to input events such as mouse hover.|
| limit         | {% include type t="Number" %}   | The maximum allowed length in pixels of legend labels. |
| name          | {% include type t="String" %}  | A [mark name](../marks) property to apply to the title text mark.|
| style         | {% include type t="String|String[]" %}  | A [mark style](../marks) property to apply to the title text mark. If not specified, a default style of `"group-title"` is applied.|
| offset        | {% include type t="Number|Value" %} | The orthogonal offset in pixels by which to displace the title from its position along the edge of the chart.|
| zindex        | {% include type t="Number" %}  | The integer z-index indicating the layering of the title group relative to other axis, mark and legend groups. The default value is `0`.|

To create themes, new default values for many title properties can be set using a [config](../config) object.

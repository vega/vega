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
| anchor        | {% include type t="String" %}  | The anchor position for placing the title. One of `start`, `middle` (the default), or `end`. For example, with an orientation of `top` these anchor positions map to a left-, center-, or right-aligned title.|
| encode        | {% include type t="Object" %}  | Optional mark encodings for custom title styling. This is a standard encode block for text marks, and may contain `enter`, `exit`, `update`, and `hover` property sets. To set a custom font, font size, _etc._ for a title, one can either use custom encode blocks or update the title [config](../config).|
| interactive   | {% include type t="Boolean" %} | A boolean flag indicating if the title element should respond to input events such as mouse hover.|
| name          | {% include type t="String" %}  | A [mark name](../marks) property to apply to the title text mark.|
| offset        | {% include type t="Number|Value" %} | The orthogonal offset in pixels by which to displace the title from its position along the edge of the chart.|
| zindex        | {% include type t="Number" %}  | The integer z-index indicating the layering of the title group relative to other axis, mark and legend groups. The default value is `0`.|

To create themes, new default values for many title properties can be set using a [config](../config) object.

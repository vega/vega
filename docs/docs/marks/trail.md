---
layout: mark
title: Trail Mark
permalink: /docs/marks/trail/index.html
---

**Trail** marks are similar to line marks, but can have variable widths determined by backing data. Unlike area marks, trails do not have a set vertical or horizontal orientation: they can follow arbitrary trajectories. However, unlike lines, trails do not support different interpolation methods and use _fill_ (not _stroke_) for their color. Trail marks are useful if one wishes to draw lines that change size to reflect the underlying data.

### Example

{% include embed spec="trail" %}

### Type-Specific Mark Properties

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| size                | {% include type t="Number" %}  | The width in pixels of the trail at the given data point. |
| defined             | {% include type t="Boolean" %} | A boolean flag indicating if the current data point is defined. If `false`, the corresponding trail segment will be omitted, creating a "break". |

{% include properties.md %}

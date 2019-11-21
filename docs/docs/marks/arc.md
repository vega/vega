---
layout: mark
title: Arc Mark
permalink: /docs/marks/arc/index.html
---

**Arc** marks are circular arcs defined by a center point plus angular and radial extents. Arc marks are typically used for radial plots such as pie and donut charts, but are also useful for radial space-filling visualizations of hierarchical data.

## Example

{% include embed spec="arc" %}

## Type-Specific Mark Properties

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| startAngle          | {% include type t="Number" %}  | The start angle in radians. A value of `0` indicates up or "north", increasing values proceed clockwise. |
| endAngle            | {% include type t="Number" %}  | The end angle in radians. A value of `0` indicates up or "north", increasing values proceed clockwise. |
| padAngle            | {% include type t="Number" %}  | The angular padding applied to sides of the arc, in radians. |
| innerRadius         | {% include type t="Number" %}  | The inner radius in pixels. |
| outerRadius         | {% include type t="Number" %}  | The outer radius in pixels. |
| cornerRadius        | {% include type t="Number" %}  | The radius in pixels of rounded arc corners (default `0`). |

The _x_ and _y_ properties determine the center of the circle from which the arc is defined.

{% include properties.md %}

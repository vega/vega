---
layout: mark
title: Line Mark
permalink: /docs/marks/line/index.html
---

**Line** marks are stroked paths with constant width, defined by an ordered set of (x, y) coordinates. While line marks default to using straight line segements, different interpolation methods can be used to create smoothed or stepped paths. Line marks are commonly used to depict trajectories or change over time.

## Example

{% include embed spec="line" %}

## Type-Specific Mark Properties

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| interpolate         | {% include type t="String" %}  | The interpolation method to use. One of `basis`, `bundle`, `cardinal`, `catmull-rom`, `linear`, `monotone`, `natural`, `step`, `step-after`, `step-before`. The default is `linear`. |
| tension             | {% include type t="Number" %}  | The tension value in the range [0, 1] to parameterize `bundle` (default 0.8), `cardinal` (default 0) or `catmull-rom` (default 0.5) interpolation. |
| defined             | {% include type t="Boolean" %} | A boolean flag indicating if the current data point is defined. If `false`, the corresponding line segment will be omitted, creating a "break". |

_Note_: If a data point on a line is surrounded by points with `defined: false`, it may not be visible. Use a `strokeCap` of `round` or `square` to ensure a visible point is drawn.

{% include properties.md %}

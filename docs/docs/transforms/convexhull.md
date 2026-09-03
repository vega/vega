---
layout: transform
title: Convex Hull Transform
permalink: /docs/transforms/convexhull/index.html
---

The **convexhull** transform computes the convex hull for a set of input points and generates a new data stream of hull vertices. Hull vertices can be plotted with an existing line or area mark, including one hull per group.

## Example

{% include embed spec="convexhull" %}

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| x                   | {% include type t="Field" %}   | {% include required %} The data field for point x-coordinates.|
| y                   | {% include type t="Field" %}   | {% include required %} The data field for point y-coordinates.|
| groupby             | {% include type t="Field[]" %} | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| offset              | {% include type t="Number" %}  | A distance in input coordinate units by which to expand the hull polygon. The default is `0`.|
| as                  | {% include type t="String[]" %}| The output fields for offset x, offset y, original hull x, and original hull y values. The default is `["x", "y", "x0", "y0"]`.|

## Usage

```json
{
  "type": "convexhull",
  "x": "layout_x",
  "y": "layout_y",
  "groupby": ["category"],
  "offset": 4,
  "as": ["hx", "hy", "x", "y"]
}
```

Computes one convex hull per `category`, expands each hull by 4 coordinate units, and writes offset hull coordinates to `hx` and `hy` while preserving the original hull coordinates in `x` and `y`.

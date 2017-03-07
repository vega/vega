---
layout: transform
title: Voronoi Transform
permalink: /docs/transforms/voronoi/index.html
---

The **voronoi** transform computes a [voronoi diagram](https://en.wikipedia.org/wiki/Voronoi_diagram) for a set of input points and returns the computed cell paths. The Voronoi cells can then be used to identify the nearest point for a given value. For example, a Voronoi diagram can be used to automatically select the data point closest to the mouse cursor.

## Example

{% include embed spec="voronoi" %}

Click (or drag) to add points. Shift-click (or shift-drag) to remove points.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| x                   | {% include type t="Field" %}   | The data field for point x-coordinates.|
| y                   | {% include type t="Field" %}   | The data field for point y-coordinates.|
| extent              | {% include type t="Array[]" %} | The clip extent of the Voronoi cells. The extent bounds are specified as an array `[[x0, y0], [x1, y1]]`, where x0 is the left side of the extent, y0 is the top, x1 is the right and y1 is the bottom. For example, `[[-1e5, -1e5], [1e5, 1e5]]` will clip the voronoi diagram at 10,000 pixels in both the negative and positive directions.|
| size                | {% include type t="Number[]" %}| An alternative to `extent` that sets the clip extent to `[[0,0], size]`.|
| as                  | {% include type t="String[]" %}| The output field for the Voronoi cell SVG path string. The default is `path`.|

## Usage

```json
{"type": "voronoi", "x": "layout_x", "y": "layout_y", "as": "cell"}
```

Computes Voronoi cell paths based on previously computed layout coordinates, and writes the result to the field name `"cell"`.

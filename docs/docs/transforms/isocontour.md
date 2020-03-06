---
layout: transform
title: Isocontour Transform
permalink: /docs/transforms/isocontour/index.html
---

The **isocontour** transform {% include tag ver="5.8" %} models a spatial distribution of data values using a set of discrete levels. Each [contour line](https://en.wikipedia.org/wiki/Contour_line) is an isoline of constant value. A common use case is to convey density estimates for 2D point data, as these can provide a more scalable representation for large numbers of data points.

The isocontour transform take as input one or more raster grids (matrices) of numerical values and generates a stream of [GeoJSON](https://en.wikipedia.org/wiki/GeoJSON) geometry data as output. These shapes can then be visualized using either the [geoshape](../geoshape) or [geopath](../geopath) transform. For a complete example, see the [contour plot example visualization](../../../examples/contour-plot/).

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| field               | {% include type t="Field" %}    | The field with raster grid data. If unspecified, the data object itself is interpreted as a raster grid. |
| thresholds          | {% include type t="Number[]" %} | A threshold array of explicit contour level values. If specified, the _levels_, _nice_, _resolve_, and _zero_ parameters are ignored. |
| levels              | {% include type t="Number" %}   | The desired number of equally-spaced contours. This parameter is ignored if the _thresholds_ parameter is provided. |
| nice                | {% include type t="Boolean" %}  | A boolean flag (default `false`) indicating if the contour threshold values should be automatically aligned to "nice", human-friendly values. Setting this flag may cause the number of thresholds to deviate from the exact _levels_ value.|
| resolve             | {% include type t="String" %}  | The method for resolving thresholds across multiple input grids. If `'independent'` (the default), threshold calculation will be performed separately for each grid. If `'shared'`, a single set of threshold values will be used for all input grids. |
| zero                | {% include type t="Boolean" %}  | A boolean flag (default `true`) indicating if the contour threshold values should include zero as a baseline value. |
| smooth              | {% include type t="Boolean" %}  | A boolean flag (default `true`) indicating if the contour polygons should be smoothed using linear interpolation. This parameter is ignored when using kernel density estimation. |
| scale               | {% include type t="Number|Number[]" %}   | A numerical value or two-element *[sx, sy]* number array by which to scale the output isocontour coordinates. This parameter can be useful to scale the contours to match a desired coordinate space. Support for array input in versions {% include tag ver="5.9" %}. |
| translate           | {% include type t="Number[]" %}   | A two-element *[dx, dy]* number array by which to translate output isocontour coordinates. This parameter can be useful to map the contours to match a desired coordinate space. {% include tag ver="5.9" %} |
| as                  | {% include type t="String" %}   | The output field at which to write a generated isocontour. The default is `"contour"`. |

## Usage

This example generates 10 levels of contours for the 2D kernel density estimate of a source data stream. The backing [kde2d](../kde2d) transform draws pre-computed pixel (x, y) coordinates from the `x_value` and `y_value` data fields, and uses the `width` and `height` signals to configure the area over which densities, and subsequent contours, should be computed.

```json
{
  "type": "kde2d",
  "x": "x_value",
  "y": "y_value",
  "size": [{"signal": "width"}, {"signal": "height"}],
  "as": "grid"
},
{
  "type": "isocontour",
  "field": "grid",
  "levels": 10
}
```

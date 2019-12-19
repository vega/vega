---
layout: transform
title: Contour Transform
permalink: /docs/transforms/contour/index.html
---

**Note**: As of Vega {% include tag ver="5.8" %} this transform is _deprecated_ and may be removed in a future major release. For similar but more flexible functionality, please use the [isocontour](../isocontour) and [kde2d](../kde2d) transforms.

The **contour** transform models a spatial distribution of data values using a set of discrete levels. Each [contour line](https://en.wikipedia.org/wiki/Contour_line) is an isoline of constant value. A common use case is to convey density estimates for 2D point data, as these can provide a more scalable representation for large numbers of data points.

The contour transform generates a new stream of [GeoJSON](https://en.wikipedia.org/wiki/GeoJSON) geometry data as output. These shapes can then be visualized using either the [geoshape](../geoshape) or [geopath](../geopath) transform. This transform provides the functionality of both the [contours](https://github.com/d3/d3-contour/#contours) and [densityContour](https://github.com/d3/d3-contour/#densityContour) methods of the [d3-contour](https://github.com/d3/d3-contour) module.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| size                | {% include type t="Number[]" %}  | {% include required %} The dimensions `[width, height]` over which to compute contours. If the values parameter is provided, this must be the dimensions of the input data. If density estimation is performed, this is the output view dimensions in pixels.|
| values              | {% include type t="Number[]" %} |  An array of numeric values representing an width x height grid of values over which to compute contours. If unspecified, this transform will instead compute contours for the kernel density estimate of input data.|
| x                   | {% include type t="Field" %}    | The pixel x-coordinate field for density estimation.|
| y                   | {% include type t="Field" %}    | The pixel y-coordinate field for density estimation.|
| weight              | {% include type t="Field" %}    | The data point weight field for density estimation. If unspecified, all data points are assumed to have a weight of 1. {% include tag ver="4.0" %}|
| cellSize            | {% include type t="Number" %}   | Contour density calculation cell size. |
| bandwidth           | {% include type t="Number" %}   | Kernel density estimation bandwidth.|
| smooth              | {% include type t="Boolean" %}  | A boolean flag (default `true`) indicating if the contour polygons should be smoothed using linear interpolation. This parameter is ignored when using kernel density estimation.|
| thresholds          | {% include type t="Number[]" %} | A threshold array of explicit contour boundaries. If this parameter is set, the _count_ and _nice_ parameters will be ignored.|
| count               | {% include type t="Number" %}   | The desired number of contours. This parameter is ignored if the _thresholds_ parameter is provided.|
| nice                | {% include type t="Boolean" %}  | A boolean flag (default `false`) indicating if the contour threshold values should be automatically aligned to "nice", human-friendly values. Setting this flag may cause the number of thresholds to deviate from the exact _count_.|


## Usage

This example generates 10 levels of contours for the 2D kernel density estimate of a source data stream. The transform draws pre-computed pixel (x, y) coordinates from the `x_value` and `y_value` data fields, and uses the `width` and `height` signals to configure the area over which contours should be computed.

```json
{
  "type": "contour",
  "x": "x_value",
  "y": "y_value",
  "size": [{"signal": "width"}, {"signal": "height"}],
  "count": 10
}
```

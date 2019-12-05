---
layout: transform
title: KDE2D Transform
permalink: /docs/transforms/kde2d/index.html
---

The **kde2d** transform {% include tag ver="5.8" %} performs two-dimensional [kernel density estimation](https://en.wikipedia.org/wiki/Kernel_density_estimation) over an input data stream and returns the results as one or more raster grids (matrices) of density estimates. The output raster grids can be used downstream to create [isocontour](../isocontour) or [heatmap](../heatmap) visualizations. For a complete example, see the [contour plot example visualization](../../../examples/contour-plot/).

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| size                | {% include type t="Number[]" %} | {% include required %} The spatial dimensions `[width, height]` over which to perform density estimation. |
| x                   | {% include type t="Field" %}    | {% include required %} The x-coordinate field for density estimation. |
| y                   | {% include type t="Field" %}    | {% include required %} The y-coordinate field for density estimation. |
| weight              | {% include type t="Field" %}    | The data point weight field for density estimation. If unspecified, all data points are assumed to have a weight of 1. |
| groupby             | {% include type t="Field[]" %}  | The data fields to group by. If not specified, a single group containing all data objects will be used. |
| cellSize            | {% include type t="Number" %}   | Contour density calculation cell size. This parameter determines the level of spatial approximation. For example, the default value of `4` results in 2x reductions to the _width_ and _height_. A value of `1` results in an output raster grid with base dimensions matching the _size_ parameter. |
| bandwidth           | {% include type t="Number[]" %} | The KDE kernel bandwidths. The input can be a two-element array specifying separate x and y bandwidths, or a single-element array specifying both. If the values are unspecified or less than zero, the bandwidth will be automatically determined. |
| counts              | {% include type t="Boolean" %}  | A boolean flag indicating if the output values should be probability estimates (`false`, default) or smoothed counts (`true`). |
| as                  | {% include type t="String" %}   | The output field at which to write a generated raster grid. The default is `"grid"`. |

## Usage

This example generates 10 levels of contours for the 2D kernel density estimate of a source data stream. The [kde2d](../kde2d) transform draws pre-computed pixel (x, y) coordinates from the `x_value` and `y_value` data fields, and uses the `width` and `height` signals to configure the area over which densities. A subsequent [isocontour](../isocontour) transform then generates level sets for the output raster grid of density estimates.

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

---
layout: transform
title: Heatmap Transform
permalink: /docs/transforms/heatmap/index.html
---

The **heatmap** transform {% include tag ver="5.8" %} renders input raster grids (matrices) into output [heatmap images](https://en.wikipedia.org/wiki/Heat_map). This transform can be used to visualize 2D input raster data, density estimates, or mathematical functions as color grids.

The heatmap transform take as an input a raster grid (matrix) of numerical values. The output value is a [Canvas bitmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas) that can be drawn using an [image mark](../../marks/image). The Canvas bitmap dimensions will match those of the input raster grid. The actual rendered image dimensions are determined by the image mark width and height properties. For a complete example, see the [contour plot example visualization](../../../examples/contour-plot/).

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| field               | {% include type t="Field" %}    | The field with raster grid data. If unspecified, the data object itself is interpreted as a raster grid. |
| color               | {% include type t="Color|Expr" %} | A color value or expression for setting each individual pixel's color. If an expression is provided, it will be invoked with an input `datum` that includes `$x`, `$y`, `$value`, and `$max` fields for the grid. If unspecified, the color defaults to gray (`"#888"`).|
| opacity             | {% include type t="Number|Expr" %} | A constant opacity value or expression for setting each individual pixel's opacity. If an expression is provided, it will be invoked with an input `datum` that includes `$x`, `$y`, `$value`, and `$max` fields for the grid. If unspecified,the opacity defaults to `$value / $max`.|
| resolve             | {% include type t="String" %}  | The method for resolving maximum values (`datum.$max`) across multiple input grids. If `'independent'` (the default), maximum calculation will be performed separately for each grid. If `'shared'`, a single global maximum will be used for all input grids. |
| as                  | {% include type t="String" %}   | The output field at which to write the generated bitmap canvas images. The default is `"image"`. |

## Usage

### Heatmap of 2D Densities

This example generates a heatmap for the 2D kernel density estimate of a source data stream. The backing [kde2d](../kde2d) transform draws pre-computed pixel (x, y) coordinates from the `x_value` and `y_value` data fields, and uses the `width` and `height` signals to configure the area over which densities, and thus the subsequent heatmap, should be computed. The heatmap uses a solid blue _color_ and normalized grid values for the _opacity_. The _opacity_ expression used here matches the default used by the transform if no opacity is specified.

```json
{
  "type": "kde2d",
  "x": "x_value",
  "y": "y_value",
  "size": [{"signal": "width"}, {"signal": "height"}],
  "as": "grid"
},
{
  "type": "heatmap",
  "field": "grid",
  "color": "steelblue",
  "opacity": {"expr": "datum.$value / datum.$max"}
}
```

### Heatmap of a Mathematical Function

This example generates a heatmap visualization of a 2D sinusoidal function. The input data object specifies the width and height of the heatmap image, but does not provide raster grid values. A custom expression uses the `$x` and `$y` pixel properties, along with the defined color scale, to dynamically populate the output heatmap image.

```json
{
  "signals": [
    {"name": "scale", "value": 0.05}
  ],
  "scales": [
    {
      "name": "color",
      "type": "linear",
      "domain": [-1, 1],
      "range": {"scheme": "spectral"}
    }
  ],
  "data": [
    {
      "name": "heatmap",
      "values": [{"width": 150, "height": 100}],
      "transform": [
        {
          "type": "heatmap",
          "color": {
            "expr": "scale('color', sin(scale * (datum.$x + datum.$y)) * sin(scale * (datum.$x - datum.$y)))"
          },
          "opacity": 1
        }
      ]
    }
  ]
}
```

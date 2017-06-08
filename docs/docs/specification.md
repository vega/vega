---
layout: spec
title: Specification
permalink: /docs/specification/index.html
---

A Vega *specification* defines an interactive visualization in [JavaScript Object Notation (JSON)](http://en.wikipedia.org/wiki/JSON).

Below is a basic outline of a Vega specification. Complete specifications include definitions for an appropriate subset of the _data_, _scales_, _axes_, _marks_, _etc._ properties.

{: .suppress-error}
```json
{
  "$schema": "https://vega.github.io/schema/vega/v3.0.json",
  "description": "A specification outline example.",
  "width": 500,
  "height": 200,
  "padding": 5,
  "autosize": "pad",

  "signals": [],
  "data": [],
  "scales": [],
  "projections": [],
  "axes": [],
  "legends": [],
  "marks": []
}
```

## Top-Level Specification Properties

| Property        | Type                          | Description                 |
| :-------------- | :---------------------------: | :-------------------------- |
| $schema         | {% include type t="URL" %}    | The URL for the Vega schema.|
| description     | {% include type t="String" %} | A text description of the visualization.|
| background      | {% include type t="Color" %}  | The background color of the entire view (defaults to transparent).|
| width           | {% include type t="Number" %} | The width in pixels of the data rectangle.|
| height          | {% include type t="Number" %} | The height in pixels of the data rectangle.|
| padding         | {% include type t="Number" %}{% include or %}{% include type t="Object" %} | The padding in pixels to add around the visualization. If a number, specifies padding for all sides. If an object, the value should have the format `{"left": 5, "top": 5, "right": 5, "bottom": 5}`. Padding is applied _after_ autosize layout completes.|
| autosize        | {% include type t="String|Object" %} | Sets how the visualization size should be determined. If a string, should be one of `pad` (default), `fit` or `none`. If an object, the value should have the format `{"type": "pad", "resize": true}`, where `type` is one of the autosize strings and resize is a boolean indicating if autosize layout should be re-calculated on every update. See the [autosize options](#autosize) section below for more.|
| config          | [Config](../config) | Configuration settings with default values for marks, axes and legends.|
| signals         | {% include array t="[Signal](../signals)" %} | Signals are dynamic variables that parameterize a visualization.|
| data            | {% include array t="[Data](../data)" %} | Data set definitions and transforms define the data to load and how to process it.|
| scales          | {% include array t="[Scale](../scales)" %} | Scales map data values (numbers, dates, categories, etc) to visual values (pixels, colors, sizes).|
| projections     | {% include array t="[Projection](../projections)" %} | Cartographic projections map _(longitude, latitude)_ pairs to projected _(x, y)_ coordinates.|
| axes            | {% include array t="[Axis](../axes)" %} | Coordinate axes visualize spatial scale mappings.|
| legends         | {% include array t="[Legend](../legends)" %} | Legends visualize scale mappings for visual values such as color, shape and size.|
| marks           | {% include array t="[Mark](../marks)" %} | Graphical marks visually encode data using geometric primitives such as rectangles, lines, and plotting symbols.|
| encode          | [Encode](../marks/#encode) | Encoding directives for the visual properties of the top-level [group mark](../marks/group) representing a chart's data rectangle. For example, this can be used to set a background fill color for the plotting area, rather than the entire view.|

## <a name="autosize"></a>Autosize Options

The size of a Vega visualization may be determined by multiple factors: specified _width_, _height_, and _padding_ values, as well as content such as axes, legends, and titles. The support different use cases, Vega provides three different *autosize* options for determining the total size of a visualization view:

- `none`: No automatic sizing is performed. The total visualization size is determined solely by the provided width, height and padding values. For example, the total width is calculated as `width + padding.left + padding.right`. Any content lying outside this region will be clipped.
- `pad`: Automatically increase the size of the view such that all visualization content is visible. This is the default _autosize_ setting, and ensures that axes, legends and other items outside the normal width and height are included. The total size will often exceed the specified width, height, and padding.
- `fit`: Automatically adjust the layout in an attempt to force the total visualization size to fit within the given width, height and padding values. This setting causes the plotting region to be made smaller in order to accommodate axes, legends and titles. As a result, the value of the _width_ and _height_ signals may be changed to modify the layout. Though effective for many plots, the `fit` method can not always ensure that all content remains visible. For example, if the axes and legends alone require more space than the specified width and height, some of the content will be clipped.

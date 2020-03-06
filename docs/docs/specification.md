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
  "$schema": "https://vega.github.io/schema/vega/v5.json",
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
| description     | {% include type t="String" %} | A text description of the visualization. In versions {% include tag ver="5.10" %}, the description determines the [`aria-label` attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute) for the container element of a Vega view.|
| background      | {% include type t="Color|Signal" %}  | The background color of the entire view (defaults to transparent). If signal-valued {% include tag ver="5.10" %}, the provided expression is used as the `update` property for the underlying `background` [signal definition](../signals).|
| width           | {% include type t="Number|Signal" %} | The width in pixels of the data rectangle. If signal-valued {% include tag ver="5.10" %}, the provided expression is used as the `update` property for the underlying `width` [signal definition](../signals).|
| height          | {% include type t="Number|Signal" %} | The height in pixels of the data rectangle. If signal-valued {% include tag ver="5.10" %}, the provided expression is used as the `update` property for the underlying `height` [signal definition](../signals).|
| padding         | {% include type t="Number|Object|Signal" %} | The padding in pixels to add around the visualization. If a number, specifies padding for all sides. If an object, the value should have the format `{"left": 5, "top": 5, "right": 5, "bottom": 5}`. Padding is applied _after_ autosize layout completes. If signal-valued {% include tag ver="5.10" %}, the provided expression is used as the `update` property for the underlying `padding` [signal definition](../signals), and should evaluate to either a padding object or number.|
| autosize        | {% include type t="String|[Autosize](#autosize)|Signal" %} | Sets how the visualization size should be determined. If a string, should be one of `pad` (default), `fit`, `fit-x`, `fit-y`, or `none`. Object values can additionally specify parameters for content sizing and automatic resizing. See the [autosize](#autosize) section below for more. If signal-valued {% include tag ver="5.10" %}, the provided expression is used as the `update` property for the underlying `autosize` [signal definition](../signals), and should evaluate to a complete [autosize](#autosize) object.|
| config          | [Config](../config) | Configuration settings with default values for marks, axes, and legends.|
| signals         | {% include array t="[Signal](../signals)" %} | Signals are dynamic variables that parameterize a visualization.|
| data            | {% include array t="[Data](../data)" %} | Data set definitions and transforms define the data to load and how to process it.|
| scales          | {% include array t="[Scale](../scales)" %} | Scales map data values (numbers, dates, categories, etc) to visual values (pixels, colors, sizes).|
| projections     | {% include array t="[Projection](../projections)" %} | Cartographic projections map _(longitude, latitude)_ pairs to projected _(x, y)_ coordinates.|
| axes            | {% include array t="[Axis](../axes)" %} | Coordinate axes visualize spatial scale mappings.|
| legends         | {% include array t="[Legend](../legends)" %} | Legends visualize scale mappings for visual values such as color, shape and size.|
| title           | {% include type t="[Title](../title)" %} | Title text to describe a visualization.|
| marks           | {% include array t="[Mark](../marks)" %} | Graphical marks visually encode data using geometric primitives such as rectangles, lines, and plotting symbols.|
| encode          | [Encode](../marks/#encode) | Encoding directives for the visual properties of the top-level [group mark](../marks/group) representing a chart's data rectangle. For example, this can be used to set a background fill color for the plotting area, rather than the entire view.|
| usermeta        | {% include type t="Object" %} | Optional metadata  that will be ignored by the Vega parser.|


## <a name="autosize"></a>Autosize

Vega views can be sized (and resized) in various ways.
If an object, the value should have the format `{"type": "pad", "resize": true}`, where `type` is one of the autosize strings and resize is a boolean indicating if autosize layout should be re-calculated on every update.

| Name          | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| type          | {% include type t="String" %} | {% include required %} The sizing format type. One of `"pad"` (default), `"fit"`, `"fit-x"`, `"fit-y"`, or `"none"`. See the [autosize types](#autosize-types) documentation for descriptions of each.|
| resize        | {% include type t="Boolean" %}| A boolean flag indicating if autosize layout should be re-calculated on every view update. The default (`false`) causes layout to be performed once upon initialization and in response to changes in the height and/or width signals (see [here](https://github.com/vega/vega/blob/master/packages/vega-view/src/size.js) for more on sizing logic). Otherwise, the layout is kept stable. To externally force a resize, use the [View.resize](../api/view/#view_resize) API method.|
| contains      | {% include type t="String" %}| Determines how size calculation should be performed, one of `content` (default) or `padding`. The default setting (`content`) interprets the _width_ and _height_ settings as the data rectangle (plotting) dimensions, to which _padding_ is then added. In contrast, the `padding` setting includes the _padding_ within the view size calculations, such that the _width_ and _height_ settings indicate the **total** intended size of the view.|


## <a name="autosize-types"></a>Autosize Types

The total size of a Vega visualization may be determined by multiple factors: specified _width_, _height_, and _padding_ values, as well as content such as axes, legends, and titles. The support different use cases, Vega provides three different _autosize_ types for determining the final size of a visualization view:

- `none`: No automatic sizing is performed. The total visualization size is determined solely by the provided width, height and padding values. For example, by default the total width is calculated as `width + padding.left + padding.right`. Any content lying outside this region will be clipped. If _autosize.contains_ is set to `"padding"`, the total width is instead simply _width_.
- `pad`: Automatically increase the size of the view such that all visualization content is visible. This is the default _autosize_ setting, and ensures that axes, legends and other items outside the normal width and height are included. The total size will often exceed the specified width, height, and padding.
- `fit`: Automatically adjust the layout in an attempt to force the total visualization size to fit within the given width, height and padding values. This setting causes the plotting region to be made smaller in order to accommodate axes, legends and titles. As a result, the value of the _width_ and _height_ signals may be changed to modify the layout. Though effective for many plots, the `fit` method can not always ensure that all content remains visible. For example, if the axes and legends alone require more space than the specified width and height, some of the content will be clipped. Similar to `none`, by default the total width will be `width + padding.left + padding.right`, relative to the original, unmodified _width_ value. If _autosize.contains_ is set to `"padding"`, the total width will instead be the original _width_.
- `fit-x`: Similar to `fit`, except that only the width (x-axis) is adjusted to fit the given dimensions. The view height is automatically sized as if set to `pad`. {% include tag ver="3.1" %}
- `fit-y`: Similar to `fit`, except that only the height (y-axis) is adjusted to fit the given dimensions. The view width is automatically sized as if set to `pad`. {% include tag ver="3.1" %}

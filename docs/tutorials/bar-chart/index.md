---
layout: tutorials
title: "Let's Make A Bar Chart Tutorial"
permalink: /tutorials/bar-chart/index.html
---

This tutorial introduces the basics of Vega. We'll look at a bar chart with tooltips and deconstruct it into its component elements. After completing the tutorial, you should be ready to start exploring and modifying Vega visualizations.

Here is one of the most basic (but also most useful!) forms of visualization, the humble bar chart:

{% include embed spec="bar-chart" dir="." %}

Here is the Vega specification that defines this bar chart. First read through the full definition. We'll then examine each part in turn.

```json
{% include_relative bar-chart.vg.json %}
```

We'll now walk through the visualization definition visiting each of these components:

1. [Visualization Size](#visualization-size)
2. [Data](#data)
3. [Scales](#scales)
4. [Axes](#axes)
5. [Marks](#marks)
6. [Signals](#signals)
7. [Next Steps](#next-steps)


## <a name="visualization-size"></a>Visualization Size

The first set of top-level properties determine the size of the visualization:

{: .suppress-error}
```json
  "width": 400,
  "height": 200,
  "padding": 5,
  "autosize": "pad",
```

The `width` and `height` values determine the size of the _data rectangle_: the area of the chart in which data is plotted. Additional components, such as axes and legends, may take up additional space.

The `padding` determines the margin between the chart content and the border of the view.

The `autosize` property determines how the final chart size is determined:

- `"pad"` (the default) introduces extra space to accommodate all visualized marks, including axes and legends. The data rectangle size is unchanged. If any marks are placed at extreme positions outside the data rectangle, the view component may become very large!
- `"fit"` tries to fit the entire chart (data rectangle, axes, legends, but _not_ padding) within the provided `width` and `height`. Vega will shrink the data rectangle to accommodate axes and legends. In some cases clipping may occur, for instance if a legend is very tall.
- `"none"` disables automatic sizing. The total chart size is determined solely by the `width` and `height` plus `padding`. There are no modifications to accommodate axes, legends, etc.

For more details, see the [top-level specification](../../docs/specification) documentation.

## <a name="data"></a>Data

The `data` property is an array of data definitions. Each entry in the data array must be an object with a unique `name` for the data set. As shown here, data can be directly defined inline using the `values` property. In this example, we have an array of data objects with fields named `category` (a string label) and `amount` (a number).

{: .suppress-error}
```json
  "data": [
    {
      "name": "table",
      "values": [
        {"category": "A", "amount": 28},
        {"category": "B", "amount": 55},
        {"category": "C", "amount": 43},
        {"category": "D", "amount": 91},
        {"category": "E", "amount": 81},
        {"category": "F", "amount": 53},
        {"category": "G", "amount": 19},
        {"category": "H", "amount": 87}
      ]
    }
  ],
```

In Vega specifications, data can be:

- loaded from the web by using the `url` property (including JSON and CSV files),
- derived from a previously defined data set using the `source` property, or
- left undefined and dynamically set when the visualization is constructed.

Only _one_ of the `values`, `url` or `source` properties may be defined.

When a data set is loaded into Vega, a unique `_id` field is added to each input datum. Data sets in Vega can be modified using a collection of [transforms](../../docs/transforms) such as filtering, aggregation and layout operations. Transformations are specified using the `transform` property, which takes an array of transform definitions.

For more details, see the [data](../../docs/data) and [transform](../../docs/transforms) documentation.

## <a name="scales"></a>Scales

Scale functions map data values to visual values, such as pixel positions or colors:

{: .suppress-error}
```json
  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "domain": {"data": "table", "field": "category"},
      "range": "width",
      "padding": 0.05,
      "round": true
    },
    {
      "name": "yscale",
      "domain": {"data": "table", "field": "amount"},
      "nice": true,
      "range": "height"
    }
  ],
```

Here we've defined two scales, one each for the X and Y axes. The X-axis uses an ordinal `band` scale, which maps a `domain` of ordered elements (in this case letters) to a visual `range`. The Y-axis uses a quantitative `linear` scale. A linear scale type is used by default, and so is not explicitly included in the `yscale` definition above.

Each scale definition should have a **unique name**. Though to be precise, scale definitions nested within `group` marks _can_ repeat names to override previously defined scales &ndash; but that is a more advanced concept.

The `range` settings of `"width"` and `"height"` are conveniences provided by Vega, and in this case map to the arrays `[0, 400]` and `[200, 0]`, as defined by the size of the visualization. Ranges can also be defined explicitly as arrays of values: two-element numerical arrays should be used for spatial mappings, longer arrays (e.g., of RGB hex values like `"#ffa804"`) can be used as the range of `ordinal` scales to specify custom palettes.

The `domain` property determines the input domain for the scale. The domain can be defined directly as an array of values (a quantitative range or list of ordinal values) or determined dynamically from the data. In the example above, the domain consists of the minimum and maximum values of the `amount` field in the `table` data set. By default, quantitative scales automatically include the zero value. To disable this feature, include the property `"zero": false` in the scale definition.

The `xscale` definition also includes a fractional `padding` to add spacing between bars and a `round` parameter to make sure the bars snap to pixel boundaries. Notice that `yscale` includes the property `"nice": true`. This optional property tells Vega that the scale domain can be made "nice" so that it is more human-friendly and readable. For example, if the raw data domain is `[0, 94.345]` it is made "nicer" as `[0, 100]`.

For more details, see the [scales](../../docs/scales) documentation.

## <a name="axes"></a>Axes

Axes visualize scales using ticks and labels to help viewers interpret a chart.

{: .suppress-error}
```json
  "axes": [
    { "orient": "bottom", "scale": "xscale" },
    { "orient": "left", "scale": "yscale" }
  ],
```

At minimum, an axis definition must specify the axis orientation and the scale to visualize. Here we add an X-axis at the `bottom` of the chart, and a Y-axis to the `left` of the chart.

Now let's look at how we might further customize the axes:

{: .suppress-error}
```json
  "axes": [
    { "orient": "bottom", "scale": "xscale" },
    { "orient": "right", "scale": "yscale", "tickCount": 5,"offset": 6 }
  ],
```

Here we've adjusted the Y-axis in multiple ways, resulting in the modified chart below. By setting `"tickCount": 5`, we've requested that the axis show roughly five tick marks, rather than the ten or so shown previously. By setting `"orient": "right"`, we've requested that the axis be placed on the right side of the chart, rather than the previous left position. Finally, setting `"offset": 6` adjusts the axis position, in this case moving it to the right by 6 pixels. Here's the modified visualization:

{% include embed spec="bar-chart-axes" dir="." %}

For more details, see the [axes](../../docs/axes) documentation.

## <a name="marks"></a>Marks

Marks are the primary elements of a visualization: they are graphical primitives whose properties (such as position, size, shape, and color) can be used to visually encode data. Vega provides a set of marks that serve as building blocks that can be combined to form rich visualizations. Here, we simply use rectangles (`rect` marks) to construct a bar chart.

Every mark must have a `type` property, which determines which kind of mark (`rect`, `area`, `line`, `symbol`, etc.) to use. Next, we must specify the data to be visualized using the `from` property. In most cases, one simply needs to reference a named data set defined in the top-level `data` property. If no `from` property is provided, a single mark instance will be created.

{: .suppress-error}
```json
  "marks": [
    {
      "type": "rect",
      "from": {"data":"table"},
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": "category"},
          "width": {"scale": "xscale", "band": 1},
          "y": {"scale": "yscale", "field": "amount"},
          "y2": {"scale": "yscale", "value": 0}
        },
        "update": {
          "fill": {"value": "steelblue"}
        },
        "hover": {
          "fill": {"value": "red"}
        }
      }
    },
```

Visual mark properties, such as position and color, are specified using named _encoding sets_ defined within the `encode` property. The standard encoding sets are the `enter` set (for properties that should be set when the mark is first created), the `exit` set (for property settings when a mark is about to be removed), the `update` set (to update settings upon changes), and the `hover` set (to set properties upon mouse hover). In the example above, the `enter` set is first evaluated, followed by the `update` set, to create the bar chart. Upon mouse over, the `hover` set is evaluated to color the hovered bar in red. When the mouse leaves a bar, the `update` set is evaluated again to return the bar to its original color. Note that if we omit the `update` set, a mouse hover would cause the bar to turn permanently red!

Now let's take a closer look at the specific mark definitions in the `enter` set:

{: .suppress-error}
```json
          "x": {"scale": "xscale", "field": "category"},
          "width": {"scale": "xscale", "band": 1},
          "y": {"scale": "yscale", "field": "amount"},
          "y2": {"scale": "yscale", "value": 0}
```

The first two properties (`x` and `width`) set the horizontal position and width of the bar. The `x` mark property (the leftmost edge of the bar) is set to the value obtained by applying the scale named `"xscale"` (defined in `scales` above) to the data field `category`.

The `width` property is set to a value provided by the band scale `xscale`. Band scales chop up a spatial range into a set of uniformly sized "bands". Including `"band": 1` retrieves the full size of the band for the scale. The `1` value indicates what fraction of the band size to include; using `"band": 0.5` would use half of the band.

The second two properties (`y` and `y2`) determine the vertical position and height of the bars. Similar to `x` and `width`, one _could_ use `y` and `height` properties. However, here it is easier to specify the bar heights using two end points: one for the top of the bar (`y`) and one for the bottom of the bar (`y2`). We hardwire the value `0` and pass it through the linear `yscale` to ensure that one edge of each bar is always at zero. It actually does not matter which of `y` or `y2` is greater than the other; Vega will set the positions correctly. You can similarly use `x` and `x2`, which can be useful for creating visualizations such as horizontal bar charts and timelines.

In addition to standard graphical marks (rectangles, arcs, plotting symbols, etc), Vega also supports nested marks through the special [`group`](../../docs/marks/group) mark type. Groups are marks that can contain other marks, for example to create [small multiple displays](http://en.wikipedia.org/wiki/Small_multiple). Groups can also include custom `scales` and `axes` definitions that are specific to a group instance.

For more details, see the [marks](../../docs/marks) documentation.

## <a name="signals"></a>Signals

Signals act as dynamic variables: expressions that are automatically reevaluated when other signal values change, or when input events occur. Each signal must have a unique `name` and an initial `value`; others properties define how the signal value can change.

Here we use a signal to define a tooltip interaction. In this example, the value of the `tooltip` signal changes in response to `mouseover` and `mouseout` events on `rect` marks. Every time these events occur, the corresponding expression is evaluated and set as the `tooltip` value. Thus, when the mouse pointer is moved over a rectangle mark, `tooltip` is equal to the mark's backing datum; when the pointer is moved off the rectangle, `tooltip` is an empty object.

{: .suppress-error}
```json
  "signals": [
    {
      "name": "tooltip",
      "value": {},
      "on": [
        {"events": "rect:mouseover", "update": "datum"},
        {"events": "rect:mouseout",  "update": "{}"}
      ]
    }
  ],
```

Our `tooltip` signal tracks the datum for the currently highlighted bar. We now use this signal to dynamically adjust the visual encoding rules of a text label:

{: .suppress-error}
```json
{
  "marks": [
    ...,
    {
      "type": "text",
      "encode": {
        "enter": {
          "align": {"value": "center"},
          "baseline": {"value": "bottom"},
          "fill": {"value": "#333"}
        },
        "update": {
          "x": {"scale": "xscale", "signal": "tooltip.category", "band": 0.5},
          "y": {"scale": "yscale", "signal": "tooltip.amount", "offset": -2},
          "text": {"signal": "tooltip.amount"},
          "fillOpacity": [
            {"test": "datum === tooltip", "value": 0},
            {"value": 1}
          ]
        }
      }
    }
  ]
```

A single text mark instance serves as our tooltip text (note that the `from` property is omitted). The position and text values are drawn directly from the `tooltip` signal. To only show the tooltip text when the mouse pointer is over a rectangle, we set the `fillOpacity` using _production rules_: a chain of if-then-else rules for visual encoding. If the current datum matches the selected tooltip datum, the tooltip text is opaque, otherwise it is fully transparent.

Signals can be applied throughout a specification. For example, they can be used to specify the properties of [transforms](../../docs/transforms), [scales](../../docs/scales) and [mark encodings](../../docs/marks). For more details, see the [signals](../../docs/signals) documentation.

## <a name="next-steps"></a>Next Steps

We've now worked through a full Vega visualization! Next, we recommend experimenting with and modifying this example. Copy & paste the full specification above into the online **[Vega Editor](http://vega.github.io/new-editor/)** or fork [our example Block](https://bl.ocks.org/domoritz/cd636b15fa0e187b51b73fc60b4d3014).

- Can you adjust the scales and axes?
- Can you change the chart from a vertical bar chart to a horizontal bar chart?
- Can you visualize a new data set with a similar structure?

You should then be ready to understand and modify other examples. Many of the more advanced examples include data transforms that organize data elements and perform layout. As you experiment with different examples, you may find it useful to refer to the documentation for each of the main specification components.

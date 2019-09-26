---
layout: transform
title: DotBin Transform
permalink: /docs/transforms/dotbin/index.html
---

The **dotbin** transform {% include tag ver="5.7" %} calculates bin positions for stacking dots in a [dot plot](https://en.wikipedia.org/wiki/Dot_plot_%28statistics%29). This transform implements the "dot density" algorithm of [Wilkinson's "Dot Plots", The American Statistician, 1999](https://www.cs.uic.edu/~wilkinson/Publications/dotplots.pdf). If a *groupby* parameter is provided, bins are computed separately per group. After computing dot positions, the [stack](../stack) transform can be used to compute stacked dot positions.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| field               | {% include type t="Field" %}    | {% include required %} The data field to bin.|
| groupby             | {% include type t="Field[]" %}  | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| step                | {% include type t="Number" %}   | The step size (bin width) within which dots should be stacked. Defaults to 1/30 of the extent of the data *field*. |
| smooth              | {% include type t="Boolean" %}  | A boolean flag indicating if dot density stacks should be smoothed to reduce variance (default `false`). |
| signal              | {% include type t="String" %}   | If defined, binds the computed binning parameters (an object with _start_, _stop_ and _step_ properties) to a signal with the given name.|
| as                  | {% include type t="String" %}   | The output fields for the sample value and associated probability. The default is `"bin"`.|

## Usage

This example computes dot plot locations for the _value_ field with default _step_ parameter:

```json
[
  {"type": "dotbin", "field": "amount", "as": "bin", "signal": "dotbins"},
  {"type": "stack", "field": "amount", "groupby": ["bin"], "as": ["y0", "y1"]}
]
```

The calculated start, stop, and step values are bound to a new signal named `dotbins`. A dot plot can be constructed using a `symbol` mark with the *x*-coordinate determined by a linear scale over the *bin* field, and *y*-coordinate set to the mid-point between *y0* and *y1*. The y-axis scale and the size of the `symbol` mark depend on the x-axis scale and the output *dotbins.step* value. For more, see the [dot-plot](../../../examples/dot-plot) and [quantile-dot-plot](../../../examples/quantile-dot-plot) examples.

---
layout: transform
title: Loess Transform
permalink: /docs/transforms/loess/index.html
---

The **loess** transform {% include tag ver="5.4" %} (for *lo*cally-*e*stimated *s*catterplot *s*moothing) uses [locally-estimated regression](https://en.wikipedia.org/wiki/Local_regression) to produce a trend line. Loess performs a sequence of local weighted regressions over a sliding window of nearest-neighbor points. For standard parametric regression options, see the [regression](../regression) transform.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| x                   | {% include type t="Field" %}   | {% include required %} The data field for predictor (independent) values, typically associated with the x-axis.|
| y                   | {% include type t="Field" %}   | {% include required %} The data field for predicted (dependent) values, typically associated with the y-axis.|
| groupby             | {% include type t="Field[]" %} | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| bandwidth           | {% include type t="Number" %}  | The bandwidth parameter for the `loess` method (default 0.3).|
| as                  | {% include type t="String" %}  | The output fields for the predictor and predicted values for the line of best fit. If unspecified, the _x_ and _y_ parameter field names will be used.|

## Usage

Generate a loess trend line that models the field `dv` as a function of `iv`, using a bandwidth parameter of 0.2:

```json
{
  "type": "regression",
  "method": "loess",
  "x": "dv",
  "y": "iv",
  "bandwidth": 0.2
}
```

Generates a new data stream with points for a trend line that can then be visualized with a line mark.

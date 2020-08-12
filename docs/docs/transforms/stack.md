---
layout: transform
title: Stack Transform
permalink: /docs/transforms/stack/index.html
---

The **stack** transform computes a layout by stacking groups of values. The most common use case is to create stacked graphs, including stacked bar charts and stream graphs. This transform writes two properties to each datum, indicating the starting and ending stack values.

## Example

{% include embed spec="stack" %}

Click to add data points. Shift-click to remove data points.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| field               | {% include type t="Field" %}   | The data field that determines the stack heights.|
| groupby             | {% include type t="Field[]" %} | An array of fields by which to partition the data into separate stacks.|
| sort                | {% include type t="Compare" %} | Criteria for sorting values within each stack.|
| offset              | {% include type t="String" %}  | The baseline offset. One of "zero" (default), "center", or "normalize". The "zero" offset will stack starting at 0. The "center" offset will center the stacks. The "normalize" offset will compute percentage values for each stack point, with output values in the range [0,1].|
| as                  | {% include type t="String[]" %}| The output fields for the computed start and end stack values. The default is `["y0", "y1"]`.|

## Usage

```json
{
  "type": "stack",
  "groupby": ["x"],
  "field": "y",
  "sort": {"field": "v", "order": "descending"}
}
```

Creates stacks for each unique value of the `x` field, with the size of each item in the stack determined by the `y` field. Each stack is sorted in descending order according to the `v` field . The results are written to the `y0` and `y1` fields (the defaults), which can in turn be used to drive a scale domain for mapping to pixel positions.

```json
{
  "type": "stack",
  "groupby": ["category"],
  "field": "x",
  "sort": {
    "field": ["u", "v"],
    "order": ["ascending", "descending"]
  },
  "as": ["x0", "x1"]
}
```

Creates stacks for each unique value of the `category` field, with the size of each item in the stack determined by the `x` field. In this example, each stack is sorted according to multiple criteria (primarily by `u`, secondarily by `v`). The start and end stack values for each datum are written to the `x0` and `x1` fields.

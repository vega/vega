---
layout: transform
title: Formula Transform
permalink: /docs/transforms/formula/index.html
---

The **formula** transform extends data objects with new values according to a calculation formula.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| expr                | {% include type t="Expr" %}    | {% include required %} The formula [expression](../../expressions) for calculating derived values.|
| as                  | {% include type t="String" %}  | {% include required %} The output field at which to write the formula value.|
| initonly            | {% include type t="Boolean" %} | If `true`, the formula is evaluated only when a data object is first observed. The formula values will _not_ automatically update if data objects are modified. Th default is `false`.|


## Usage

```json
{"type": "formula", "as": "logx", "expr": "log(datum.x) / LN10"}
```

This example computes the base-10 logarithm of `x` and stores the result as the `logx` field.

```
{"type": "formula", "as": "hr", "expr": "hours(datum.date)"}
```

This example extracts the hour of the `date` field, and stores the result as the `hr` field.

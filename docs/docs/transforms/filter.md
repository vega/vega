---
layout: transform
title: Filter Transform
permalink: /docs/transforms/filter/index.html
---

The **filter** transform removes objects from a data stream based on a provided filter expression.

## Transform Parameters

| Property            | Type                        | Description   |
| :------------------ | :-------------------------: | :------------ |
| expr                | {% include type t="Expr" %} | {% include required %} A predicate [expression](../../expressions) for filtering the data. If the expression evaluates to `false`, the data object will be filtered.|

## Usage

```json
{"type": "filter", "expr": "datum.x > 10"}
```

This example retains only data elements for which the field x is greater than 10.

```json
{"type": "filter", "expr": "log(datum.y) / LN10 > 2"}
```

This example retains only data elements for which the base-10 logarithm of y is greater than 2.
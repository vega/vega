---
layout: transform
title: Extent Transform
permalink: /docs/transforms/extent/index.html
---

The **extent** transform computes the minimum and maximum values for a data field, producing a `[min, max]` array. This transform is useful for computing a value range and binding it to a signal name, for example to use as a parameter for a [bin](../bin) transform. This transform does not change the input data stream, it only computes the extent as a side effect.

## Transform Parameters

| Property            | Type                          | Description   |
| :------------------ | :---------------------------: | :------------ |
| field               | {% include type t="Field" %}  | {% include required %} The data field for which to compute the extent.|
| signal              | {% include type t="String" %} | If defined, binds the computed extent array to a signal with the given name.|

## Usage

```json
{"type": "extent", "field": "value", "signal": "extent"}
```

Computes a `[min, max]` array for the field `value` and makes it accessible as a signal named `extent`.

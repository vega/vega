---
layout: transform
title: Bin Transform
permalink: /docs/transforms/bin/index.html
---

The **bin** transform discretizes numeric values into a set of bins. A common use case is to create a histogram.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| field               | {% include type t="Field" %}    | {% include required %} The data field to bin.|
| extent              | {% include type t="Number[]" %} | {% include required %} A two-element array with the minimum and maximum values of the bin range.|
| interval            | {% include type t="String" %}   | A boolean flag (default `true`) indicating if the transform should output both the start and end bin values. If `false`, only the starting (floored) bin value is written to the output. {% include tag ver="5.8" %}|
| anchor              | {% include type t="Number" %}   | A value in the binned domain at which to anchor the bins, shifting the bin boundaries if necessary to ensure that a boundary aligns with the anchor value. By default, the minimum bin extent value serves as the anchor.|
| maxbins             | {% include type t="Number" %}   | The maximum number of bins (default `20`). There will often be fewer bins as the domain gets sliced at "nicely" rounded values.|
| base                | {% include type t="Number" %}   | The number base to use for automatic bin determination (default `10`).|
| step                | {% include type t="Number" %}   | An exact step size to use between bins. If provided, options such as _maxbins_ will be ignored.|
| steps               | {% include type t="Number[]" %} | An array of allowable step sizes to choose from.|
| span                | {% include type t="Number" %}   | The value span over which to generate bin boundaries. The default is `extent[1] - extent[0]`. This parameter allows automatic step size determination over custom spans (for example, a zoomed-in region) while retaining the overall _extent_. {% include tag ver="5.6" %}|
| minstep             | {% include type t="Number" %}   | The minimum allowed bin step size (default `0`).|
| divide              | {% include type t="Number[]" %} | Allowable bin step sub-divisions. The default value is `[5, 2]`, which indicates that for base 10 numbers (the default base) automatic bin determination can consider dividing bin step sizes by 5 and/or 2.|
| nice                | {% include type t="Boolean" %}  | If `true` (the default), attempts to make the bin boundaries use human-friendly boundaries, such as multiples of ten.|
| signal              | {% include type t="String" %}   | If defined, binds the computed binning specification (an object with _start_, _stop_ and _step_ properties) to a signal with the given name.|
| as                  | {% include type t="String[]" %} | The output fields at which to write the start and end bin values. The default is `["bin0", "bin1"]`.|

## Usage

This example will bin values in the _amount_ field into one of 5 bins between 0 and 10.

```json
{"type": "bin", "field": "amount", "extent": [0, 10], "maxbins": 5}
```

 Given the input data

```json
[
  {"amount": 3.7},
  {"amount": 6.2},
  {"amount": 5.9},
  {"amount": 8}
]
```

the bin transform produces the output

```json
[
  {"amount": 3.7, "bin0": 2, "bin1": 4},
  {"amount": 6.2, "bin0": 6, "bin1": 8},
  {"amount": 5.9, "bin0": 4, "bin1": 6},
  {"amount": 8, "bin0": 8, "bin1": 10}
]
```

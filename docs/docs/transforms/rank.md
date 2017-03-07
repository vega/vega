---
layout: transform
title: Rank Transform
permalink: /docs/transforms/rank/index.html
---

The **rank** transform computes an ascending rank score for data objects based on their observed order and any key fields.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| field               | {% include type t="Field" %}   | The key field used to rank data objects. All objects with the same value of this field will receive the same rank. If undefined, data objects are simply ranked in their existing sort order.|
| normalize           | {% include type t="Boolean" %} | If `true`, calculated ranks will be normalized to lie in the range _[0, 1]_.|
| as                  | {% include type t="String" %}  | The output field at which to write the rank value. The default is `"rank"`.|

## Usage

With the following snippet of a Vega specification

```json
{
  "data": [
    {
      "name": "table",
      "values": [
        {"x": "A", "y": 12}, {"x": "A", "y": 32},
        {"x": "B", "y": 6},  {"x": "B", "y": 35},
        {"x": "C", "y": 19}, {"x": "C", "y": 66}
      ],
      "transform": [
        {"type": "collect", "sort": {"field": "y"}},
        {"type": "rank", "field": "x"}
      ]
    }
  ]
}
```

the `table` data set will contain the tuples

```json
[
  {"x": "B", "y": 6,  "rank": 1},
  {"x": "A", "y": 12, "rank": 2},
  {"x": "C", "y": 19, "rank": 3},
  {"x": "A", "y": 32, "rank": 2},
  {"x": "B", "y": 35, "rank": 1},
  {"x": "C", "y": 66, "rank": 3}
]
```

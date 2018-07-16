---
layout: transform
title: Sequence Transform
permalink: /docs/transforms/sequence/index.html
---

The **sequence** transform generates a data stream containing a sequence of numeric values. See also the [sequence expression function](../../expressions/#sequence).

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| start               | {% include type t="Number" %}  | {% include required %} The starting value of the sequence.|
| stop                | {% include type t="Number" %}  | {% include required %} The ending value (exclusive) of the sequence.|
| step                | {% include type t="Number" %}  | The step value between sequence entries (default `1`, or `-1` if _stop < start_).|
| as                  | {% include type t="String" %}  | {% include tag ver="4.2" %} The name of the output field to which sequence values should be written (default is `"data"`). |

## Usage

```json
{"type": "sequence", "start": 0, "stop": 5}
```

Generates the data stream:

```json
[
  {"data": 0},
  {"data": 1},
  {"data": 2},
  {"data": 3},
  {"data": 4}
]
```

Specifying an output field:

```json
{"type": "sequence", "start": 1, "stop": 10, "step": 2, "as": "value" }
```

Generates the data stream:

```json
[
  {"value": 1},
  {"value": 3},
  {"value": 5},
  {"value": 7},
  {"value": 9}
]
```

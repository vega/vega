---
layout: transform
title: Collect Transform
permalink: /docs/transforms/collect/index.html
---

The **collect** transform collects all the objects in a data stream within a single array, allowing sorting by data field values.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| sort                | {% include type t="Compare" %} | A comparator definition for sorting data objects.|

## Usage

Given this data:

```json
[
  {"a": 3, "b": 1},
  {"a": 2, "b": 2},
  {"a": 1, "b": 4},
  {"a": 1, "b": 3}
]
```

### Simple sort

To sort data objects by the field `a`:

```json
{
  "type": "collect",
  "sort": {"field": "a"}
}
```

produces

```json
[
  {"a": 1, "b": 4},
  {"a": 1, "b": 3},
  {"a": 2, "b": 2},
  {"a": 3, "b": 1}
]
```

### Multi-value and multi-criteria sort

To sort data objects according to multiple criteria:

```json
{
  "type": "collect",
  "sort": {
    "field": ["a", "b"],
    "order": ["descending", "ascending"]
  }
}
```

produces

```json
[
  {"a": 3, "b": 1},
  {"a": 2, "b": 2},
  {"a": 1, "b": 3},
  {"a": 1, "b": 4}
]
```

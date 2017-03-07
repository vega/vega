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

To sort data objects by the `value` field in descending order:

```json
{
  "type": "collect",
  "sort": {
    "field": "value",
    "order": "descending"
  }
}
```

To sort data objects according to multiple criteria:

```json
{
  "type": "collect",
  "sort": {
    "field": ["a", "b"]
    "order": ["ascending", "descending"]
  }
}
```
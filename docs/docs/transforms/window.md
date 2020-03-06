---
layout: transform
title: Window Transform
permalink: /docs/transforms/window/index.html
---

The **window** transform performs calculations over sorted groups of data objects. These calculations including ranking, lead/lag analysis, and aggregates such as running sums and averages. Calculated values are written back to the input data stream.

## Example

{% include embed spec="window" %}

Explore the effects of using different frames and windowed aggregation functions.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| sort                | {% include type t="Compare" %}  | A comparator definition for sorting data objects within a window. If two data objects are considered equal by the comparator, they are considered "peer" values of equal rank. If _sort_ is not specified, the order is undefined: data objects are processed in the order they are observed and none are considered peers (the _ignorePeers_ parameter is ignored and treated as if set to `true`).|
| groupby             | {% include type t="Field[]" %}  | The data fields to by which to partition data objects into separate windows. If not specified, a single group containing all data objects will be used.|
| ops                 | {% include type t="String[]" %} | The window or aggregation operations to apply within a window, including `rank`, `lead`, `sum`, `average` or `count`. See the [window operation reference](#ops) for more.|
| fields              | {% include type t="Field[]" %}  | The data fields for which to compute aggregate or window functions. This array should align with the _ops_, _as_, and _params_ arrays. Field values can be `null` for operations that do not operate over a specific data field, including `count`, `rank`, and `dense_rank`.|
| params              | {% include type t="Array" %}    | Parameter values for window functions. This array should align with the _ops_ array. Parameter values can be `null` for operations that do not accept a parameter (such as aggregation operations).|
| as                  | {% include type t="String[]" %} | The output field names to use for each operation in _ops_. If not specified, names will be automatically generated based on the operation and field names (e.g., `rank`, `sum_field`, `average_field`).|
| frame               | {% include type t="Number[]" %}  | A frame specification as a two-element array indicating how the sliding window should proceed. The array entries should either be a number indicating the offset from the current data object, or `null` to indicate unbounded rows preceding or following the current data object. The default value is `[null, 0]`, indicating that the sliding window includes the current object and all preceding objects. The value `[-5, 5]` indicates that the window should include five objects preceding and five objects following the current object. Finally, `[null, null]` indicates that the window frame should always include all data objects.|
| ignorePeers         | {% include type t="Boolean" %}  | Indicates if the sliding window frame should ignore peer values. (Peer values are those considered identical by the _sort_ criteria). The default is `false`, causing the window frame to expand to include all peer values. If set to `true`, the window frame will be defined by offset values only. This setting only affects those operations that depend on the window frame, namely aggregation operations and the *first_value*, *last_value*, and *nth_value* window operations.|

## <a name="ops"></a> Window Operation Reference

The valid operations include all [valid aggregate operations](../aggregate/#ops) plus the following window operations.

| Operation    | Parameter | Description  |
| :----------- | :-------: | :------------|
| row_number   | _None_    | Assigns each data object a consecutive row number, starting from 1.|
| rank         | _None_    | Assigns a rank order value to each data object in a window, starting from 1. Peer values are assigned the same rank. Subsequent rank scores incorporate the number of prior values. For example, if the first two values tie for rank 1, the third value is assigned rank 3.|
| dense_rank   | _None_    | Assigns dense rank order values to each data object in a window, starting from 1. Peer values are assigned the same rank. Subsequent rank scores do not incorporate the number of prior values. For example, if the first two values tie for rank 1, the third value is assigned rank 2.|
| percent_rank | _None_    | Assigns a percentage rank order value to each data object in a window. The percent is calculated as _(rank - 1) / (group_size - 1)_. |
| cume_dist    | _None_    | Assigns a cumulative distribution value between 0 and 1 to each data object in a window.|
| ntile        | {% include type t="Number" %} | Assigns a quantile (e.g., percentile) value to each data object in a window. Accepts an integer parameter indicating the number of buckets to use (e.g., 100 for percentiles, 5 for quintiles).|
| lag          | {% include type t="Number" %} | Assigns a value from the data object that precedes the current object by a specified number of positions. If no such object exists, assigns `null`. Accepts an offset parameter (default `1`) that indicates the number of positions. This operation must have a corresponding entry in the _fields_ parameter array.|
| lead         | {% include type t="Number" %} | Assigns a value from the data object that follows the current object by a specified number of positions. If no such object exists, assigns `null`. Accepts an offset parameter (default `1`) that indicates the number of positions. This operation must have a corresponding entry in the _fields_ parameter array.|
| first_value  | _None_    | Assigns a value from the first data object in the current sliding window frame. This operation must have a corresponding entry in the _fields_ parameter array.|
| last_value   | _None_    | Assigns a value from the last data object in the current sliding window frame. This operation must have a corresponding entry in the _fields_ parameter array.|
| nth_value    | {% include type t="Number" %} | Assigns a value from the nth data object in the current sliding window frame. If no such object exists, assigns `null`. Requires a non-negative integer parameter that indicates the offset from the start of the window frame. This operation must have a corresponding entry in the _fields_ parameter array.|
| prev_value  | _None_    | If the current field value is not null and not undefined, it is returned. Otherwise, the nearest previous non-missing value in the sorted group is returned. This operation is performed relative to the sorted group, not the window frame, and must have a corresponding entry in the _fields_ parameter array. {% include tag ver="5.4" %} |
| next_value   | _None_    | If the current field value is not null and not undefined, it is returned. Otherwise, the next non-missing value in the sorted group is returned. This operation is performed relative to the sorted group, not the window frame, and must have a corresponding entry in the _fields_ parameter array.{% include tag ver="5.4" %} |

## Usage

For the following input data:

```json
[
  {"key":0, "value":1},
  {"key":1, "value":3},
  {"key":2, "value":2},
  {"key":2, "value":4},
  {"key":3, "value":3}
]
```

The window transform

```json
{
  "type": "window",
  "sort": {"field": "key", "order": "ascending"},
  "ops": ["rank", "dense_rank", "sum", "mean"],
  "fields": [null, null, "value", "value"],
  "as": ["rank", "drank", "sum", "mean"]
}
```

produces as output the augmented input stream:

```json
[
  {"key":0, "value":1, "rank":1, "drank":1, "sum":1, "mean":1},
  {"key":1, "value":3, "rank":2, "drank":2, "sum":4, "mean":2},
  {"key":2, "value":2, "rank":3, "drank":3, "sum":10, "mean":2.5},
  {"key":2, "value":4, "rank":3, "drank":3, "sum":10, "mean":2.5},
  {"key":3, "value":3, "rank":5, "drank":4, "sum":13, "mean":2.6}
]
```

### Filling in Missing Values

For the following input data:

```json
[
  {"key":0, "value":1},
  {"key":1, "value":null},
  {"key":2, "value":2},
  {"key":3 },
  {"key":4, "value":3}
]
```

The window transform

```json
{
  "type": "window",
  "sort": {"field": "key", "order": "ascending"},
  "ops": ["prev_value"],
  "fields": ["value"],
  "as": ["value"]
}
```

produces as output the modified input stream:

```json
[
  {"key":0, "value":1},
  {"key":1, "value":1},
  {"key":2, "value":2},
  {"key":3, "value":2},
  {"key":4, "value":3}
]
```

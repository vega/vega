---
layout: transform
title: Flatten Transform
permalink: /docs/transforms/flatten/index.html
---

The **flatten** transform {% include tag ver="3.1" %} maps array-valued _fields_ to a set of individual data objects, one per array entry. This transform generates a new data stream in which each data object consists of an extracted array value as well as all the original fields of the corresponding input data object.

_Note:_ The `flatten` transform only applies to array-typed data fields. If your data objects instead contain nested sub-objects with fields known at design time, you may wish to use a [fold](../fold) or [project](../project) transform instead.


## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| fields              | {% include type t="Field[]" %}  | {% include required %} An array of one or more data fields containing arrays to flatten. If multiple fields are specified, their array values should have a parallel structure, ideally with the same length. If the lengths of parallel arrays do not match, the longest array will be used with `null` values added for missing entries.|
| index               | {% include type t="String" %}   | The output field name for the zero-based index of the array values. If unspecified, an index field is not added. {% include tag ver="5.8" %}|
| as                  | {% include type t="String[]" %} | The output field names for extracted array values. If unspecified, the field name of the corresponding array field is used.|

## Usage

### Single-Field Flattening

This example flattens the array-valued field named `foo`. Note that all fields except `foo` are repeated in every output datum.

```json
{"type": "flatten", "fields": ["foo"]}
```

Input data:

```json
[
  {"name": "alpha", "data": 123, "foo": [1, 2]},
  {"name": "beta",  "data": 456, "foo": [3, 4, 5]}
]
```

Result:

```json
[
  {"name": "alpha", "data": 123, "foo": 1},
  {"name": "alpha", "data": 123, "foo": 2},
  {"name": "beta",  "data": 456, "foo": 3},
  {"name": "beta",  "data": 456, "foo": 4},
  {"name": "beta",  "data": 456, "foo": 5}
]
```

### Adding an Index Field

```json
{"type": "flatten", "fields": ["foo"], "index": "idx"}
```

This example adds an field containing the array index that each item originated from.

```json
[
  {"name": "alpha", "data": 123, "foo": [1, 2]},
  {"name": "beta",  "data": 456, "foo": [3, 4, 5]}
]
```

Result:

```json
[
  {"name": "alpha", "data": 123, "foo": 1, "idx": 0},
  {"name": "alpha", "data": 123, "foo": 2, "idx": 1},
  {"name": "beta",  "data": 456, "foo": 3, "idx": 0},
  {"name": "beta",  "data": 456, "foo": 4, "idx": 1},
  {"name": "beta",  "data": 456, "foo": 5, "idx": 2}
]
```

### Multi-Field Flattening

```json
{"type": "flatten", "fields": ["foo", "bar"]}
```

This example simultaneously flattens the array-valued fields `foo` and `bar`. Given the input data

```json
[
  {"key": "alpha", "foo": [1, 2],    "bar": ["A", "B"]},
  {"key": "beta",  "foo": [3, 4, 5], "bar": ["C", "D"]}
]
```

this example produces the output:

```json
[
  {"key": "alpha", "foo": 1, "bar": "A"},
  {"key": "alpha", "foo": 2, "bar": "B"},
  {"key": "beta",  "foo": 3, "bar": "C"},
  {"key": "beta",  "foo": 4, "bar": "D"},
  {"key": "beta",  "foo": 5, "bar": null}
]
```

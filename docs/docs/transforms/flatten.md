---
layout: transform
title: Flatten Transform
permalink: /docs/transforms/flatten/index.html
---

The **flatten** transform maps array-valued _fields_ to a set of individual data objects, one per array entry. This transform generates a new data stream in which each data object consists of an extracted array value as well as all the original fields of the corresponding input data object.

**Note:** The `flatten` transform only works with the array of arrays type of data structures. If your sub-objects are a set of fields known at the design time, you may need to use [fold](../fold) transform instead.


## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| fields              | {% include type t="Field[]" %}  | {% include required %} An array of one or more data fields containing arrays to flatten. If multiple fields are specified, their array values should have a parallel structure, ideally with the same length. If the lengths of parallel arrays do not match, the longest array will be used with `null` values added for missing entries.|
| as                  | {% include type t="String[]" %} | The output field names for extracted array values. If unspecified, the field name of the corresponding array field is used.|

## Usage

```json
{"type": "flatten", "fields": ["foo", "bar"]}
```

This example flattens the foo and bar array-valued fields. Given the input data

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

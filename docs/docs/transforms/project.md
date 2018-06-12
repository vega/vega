---
layout: transform
title: Project Transform
permalink: /docs/transforms/project/index.html
---

The **project** transform performs a <a href="https://en.wikipedia.org/wiki/Projection_(relational_algebra)">relational algebra projection operation</a>. In Vega, this results in a new stream of derived data objects that include one or more fields of the source stream. This operator supports optionally renaming the copied data fields. This operator should be not be confused with [cartographic projections](../../projections).

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| fields              | {% include type t="Field[]" %} | The data fields that should be copied over in the projection. If unspecified, all fields will be copied using their existing names.|
| as                  | {% include type t="String[]" %}  | For each corresponding field in the _fields_ array, indicates the output field name to use for derived data objects.|


## Usage

```json
{"type": "project", "fields": ["foo", "bar"]}
```

Generates a stream of derived data objects containing only the fields `"foo"` and `"bar"`.

```json
{"type": "project", "fields": ["foo", "bar"], "as": ["a", "b"]}
```

Generates a stream of derived data objects with fields `"a"` and `"b"` containing the values of the source fields `"foo"` and `"bar"`, respectively.

The project transform can also be used to un-nest properties. For example, consider the following input data:

```json
[
  {"foo": {"a": 5, "b": "abc"}, "bar": 0},
  {"foo": {"a": 6, "b": "def"}, "bar": 1},
  {"foo": {"a": 7, "b": "ghi"}, "bar": 2}
]
```

To extract the `"bar"` field along with the `"a"` and `"b"` sub-fields into new objects, use the transform:

```json
{
  "type": "project",
  "fields": ["bar", "foo.a", "foo.b"],
  "as": ["bar", "a", "b"]
}
```

This produces the following output:

```json
[
  {"bar":0, "a":5, "b":"abc"},
  {"bar":1, "a":6, "b":"def"},
  {"bar":2, "a":7, "b":"ghi"}
]
```

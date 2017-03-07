---
layout: transform
title: Cross Transform
permalink: /docs/transforms/cross/index.html
---

The **cross** transform compute the cross-product of a data stream with itself.

## Transform Parameters

| Property            | Type                         | Description   |
| :------------------ | :--------------------------: | :------------ |
| filter              | {% include type t="Expr" %}  | An optional filter expression for limiting the results of the cross-product.|
| as                  | {% include type t="Array" %} | The output fields for the two data objects being crossed. The default is `["a", "b"]`.|

## Usage

If the input data is `[{v:1}, {v:2}, {v:3}]`, then the transform definition

```json
{"type": "cross"}
```

produces the output

```json
[
  {"a": {"v": 1}, "b": {"v": 1}},
  {"a": {"v": 1}, "b": {"v": 2}},
  {"a": {"v": 1}, "b": {"v": 3}},
  {"a": {"v": 2}, "b": {"v": 1}},
  {"a": {"v": 2}, "b": {"v": 2}},
  {"a": {"v": 2}, "b": {"v": 3}},
  {"a": {"v": 3}, "b": {"v": 1}},
  {"a": {"v": 3}, "b": {"v": 2}},
  {"a": {"v": 3}, "b": {"v": 3}}
]
```

Similarly, with the same input data, the following transform

```json
{"type": "cross", "filter": "datum.a !== datum.b"}
```

produces the output

```
[
  {"a": {"v": 1}, "b": {"v": 2}},
  {"a": {"v": 1}, "b": {"v": 3}},
  {"a": {"v": 2}, "b": {"v": 1}},
  {"a": {"v": 2}, "b": {"v": 3}},
  {"a": {"v": 3}, "b": {"v": 1}},
  {"a": {"v": 3}, "b": {"v": 2}}
]
```

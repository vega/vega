---
layout: transform
title: Stratify Transform
permalink: /docs/transforms/stratify/index.html
---

The **stratify** transform generates a hierarchical (tree) data structure from input data objects, based on key fields that match parent and children nodes. Internally, this transform generates a set of tree node objects that can then be processed by tree layout methods such as [tree](../tree), [treemap](../treemap), [pack](../pack), and [partition](../partition).

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| key                 | {% include type t="Field" %}   | {% include required %} A data field containing a unique key (identifier) for each node.|
| parentKey           | {% include type t="Field" %}   | {% include required %} A data field containing the key value for each node's parent in the hierarchy.|

## Usage

```json
{
  "type": "stratify",
  "key": "id",
  "parentKey": "parent"
}
```

Builds a tree data structure from input data objects, such that each node (identified by `key`) is made the child of a parent node according to the child's `parentKey` field.

For example, given this input data:

```json
[
  {"id": "A", "parent": null},
  {"id": "B", "parent": "A"},
  {"id": "C", "parent": "A"},
  {"id": "D", "parent": "C"},
  {"id": "E", "parent": "C"}
]
```

The resulting tree structure is:

```
  /- B
A
  \- C - [D, E]
```


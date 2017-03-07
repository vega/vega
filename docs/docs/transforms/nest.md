---
layout: transform
title: Nest Transform
permalink: /docs/transforms/nest/index.html
---

The **nest** transform generates a hierarchical (tree) data structure from input data objects, based on dividing children into groups based on distinct field values. Internally, this transform generates a set of tree node objects that can then be processed by tree layout methods such as [tree](../tree), [treemap](../treemap), [pack](../pack), and [partition](../partition).

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| keys                | {% include type t="Field[]" %} | An array of data fields by which to organize the data objects into a tree. Data objects will first be grouped into siblings based on the values of the first field in the parameter array. The process then continues, creating an additional depth level for each provided field.|
| key                 | {% include type t="Field" %}   | A data field containing a unique key (identifier) for each node.|


## Usage

```json
{
  "type": "nest",
  "key": "id",
  "keys": ["job", "region"]
}
```

Builds a tree data structure from input data objects. Starting with a root node, a set of sibling groups are generated for each distinct value of the `job` field. Then, within each job, an additional set of sibling nodes are generated for each distinct value of the `region` field. Finally, all input data objects within that group are included as leaves.

For example, given this input data:

```json
[
  {"id": "A", "job": "Doctor", "region": "East"},
  {"id": "B", "job": "Doctor", "region": "East"},
  {"id": "C", "job": "Lawyer", "region": "East"},
  {"id": "D", "job": "Lawyer", "region": "East"},
  {"id": "E", "job": "Doctor", "region": "West"},
  {"id": "F", "job": "Doctor", "region": "West"},
  {"id": "G", "job": "Lawyer", "region": "West"},
  {"id": "H", "job": "Lawyer", "region": "West"}
]
```

The resulting tree structure is:

```
                  /- East - [A, B]
       /- Doctor -
      /           \- West - [E, F]
Root -
      \           /- East - [C, D]
       \- Lawyer -
                  \- West - [G, H]
```

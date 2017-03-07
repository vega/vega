---
layout: transform
title: TreeLinks Transform
permalink: /docs/transforms/treelinks/index.html
---

The **treelinks** transform generates a new stream of data objects representing links among nodes in a tree. This transform must occur downstream of a tree-generating transform such as [nest](../nest) or [stratify](../stratify). The generated link objects will have `source` and `target` fields that reference input data objects corresponding to parent (source) and child (target) nodes.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| key                 | {% include type t="Field" %}   | A data field containing a unique key (identifier) for each node. This must be the same field used by the upstream [nest](../nest) or [stratify](../stratify) transform.|

## Usage

```json
{
  "data": [
    {
      "name": "tree",
      "url": "tree.csv",
      "transform": [
        {
          "type": "stratify",
          "key": "id",
          "parentKey": "parent"
        }
      ]
    },
    {
      "name": "links",
      "source": "tree",
      "transform": [
        {
          "type": "treelinks",
          "key": "id"
        }
      ]
    }
  ]
}
```

Generates a tree data structure using a `stratify` transform, then generates a set of tree links using a `treelinks` transform.

---
layout: transform
title: TreeLinks Transform
permalink: /docs/transforms/treelinks/index.html
---

The **treelinks** transform generates a new stream of data objects representing links among nodes in a tree. This transform must occur downstream of a tree-generating transform such as [nest](../nest) or [stratify](../stratify). The generated link objects will have `source` and `target` fields that reference input data objects corresponding to parent (source) and child (target) nodes.

## Transform Parameters

_None._

## Usage

This example generates a tree data structure using a `stratify` transform, then generates a set of tree links using `treelinks`:

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
          "type": "treelinks"
        }
      ]
    }
  ]
}
```

This example generates a tree data structure using a `nest` transform, using `"generate": true` to ensure creation of internal (non-leaf) tree nodes. A `treelinks` transform then generates links between all nodes. In this case, no `key` parameter is used for either transform; instead, internal data object ids are used to identify the nodes.

```json
{
  "data": [
    {
      "name": "tree",
      "url": "tree.csv",
      "transform": [
        {
          "type": "nest",
          "keys": ["categoryA", "categoryB"],
          "generate": true
        }
      ]
    },
    {
      "name": "links",
      "source": "tree",
      "transform": [
        {
          "type": "treelinks"
        }
      ]
    }
  ]
}
```

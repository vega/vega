---
layout: example
title: Edge Bundling Example
permalink: /examples/edge-bundling/index.html
spec: edge-bundling
---

Visualizes dependencies between classes in a software class hierarchy using [hierarchical edge bundling](http://ieeexplore.ieee.org/document/4015425/). Dependency curves are routed along the tree path between source and targets nodes in the package hierarchy. This example uses Vega's [tree](../../docs/transforms/tree) transform to layout the nodes, and a [line mark](../../docs/marks/line) with `bundle` interpolation to draw dependencies. Hover over a node to highlight specific linkages.

{% include example spec=page.spec %}

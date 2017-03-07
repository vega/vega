---
layout: example
title: Sunburst Example
permalink: /examples/sunburst/index.html
spec: sunburst
---

A [sunburst diagram](http://www.cc.gatech.edu/gvu/ii/sunburst/) is a radial space-filling tree visualization, similar in spirit to a [treemap](../treemap). Adjacency, rather than containment, is used to depict hierarchical relationships. The layout is computed using Vega's [partition](../../docs/transforms/partition) transform. This example shows the software class hierarchy of the Flare visualization toolkit; node areas are proportional to the file size in bytes of each source code file.

{% include example spec=page.spec %}

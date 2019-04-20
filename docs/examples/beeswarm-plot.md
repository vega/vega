---
layout: example
title: Beeswarm Plot Example
permalink: /examples/beeswarm-plot/index.html
spec: beeswarm-plot
image: /examples/img/beeswarm-plot.png
---

A beeswarm plot conveys the size of a group of items by visually clustering the each individual data point. This example uses Vega's [force](../../docs/transforms/force) transform to calculate the clustered layout. The example uses non-standard `xfocus` and `yfocus` encoding channels to create anchor coordinates that parameterize the `x` and `y` forces.

{% include example spec=page.spec %}

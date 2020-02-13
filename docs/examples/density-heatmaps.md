---
layout: example
title: Density Heatmaps Example
permalink: /examples/density-heatmaps/index.html
spec: density-heatmaps
image: /examples/img/density-heatmaps.png
---

A trellis plot of density estimates for automobile statistics, partitioned by region of origin. The density grids produced by the [`kde2d`](../../docs/transforms/kde2d) transform are rendered as images by the [`heatmap`](../../docs/transforms/heatmap) transform. By default each heatmap is normalized independently. If _resolve_ equals "shared", the heatmaps instead show probability or count densities normalized by the global maximum across plots. This example generates heatmaps as rendered [`image`](../../docs/marks/image) marks. For an example that instead uses a grid of [`rect`](../../docs/marks/rect) marks, see the [Heatmap example](../heatmap).

{% include example spec=page.spec %}

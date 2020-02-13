---
layout: example
title: Contour Plot Example
permalink: /examples/contour-plot/index.html
spec: contour-plot
image: /examples/img/contour-plot.png
---

A contour plot depicts the density of data points as a set of discrete levels. Akin to contour lines on [topographic maps](https://en.wikipedia.org/wiki/Topographic_map), each contour boundary is an [isoline](https://en.wikipedia.org/wiki/Contour_line) of constant density. Kernel density estimation is performed with the [kde2d](../../docs/transforms/kde2d) transform to generate a continuous approximation of the sample density for each group. The [heatmap](../../docs/transforms/heatmap) transform generates heatmap images to convey these density estimates directly. The [isocontour](../../docs/transforms/isocontour) transform analyzes the density estimates to generate level set contours in the form of GeoJSON polygons.

{% include example spec=page.spec %}

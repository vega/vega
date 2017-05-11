---
layout: example
title: Contour Plot Example
permalink: /examples/contour-plot/index.html
spec: contour-plot
---

A contour plot depicts the density of data points using a set of discrete levels. Akin to contour lines on [topographic maps](https://en.wikipedia.org/wiki/Topographic_map), each contour boundary is an [isoline](https://en.wikipedia.org/wiki/Contour_line) of constant density. Kernel density estimation is performed to generate a continuous approximation of the sample density. Vega uses the [d3-contour](https://github.com/d3/d3-contour) module to perform density estimation and generate contours in the form of GeoJSON polygons.

{% include example spec=page.spec %}

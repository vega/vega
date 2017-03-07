---
layout: example
title: Zoomable World Map Example
permalink: /examples/zoomable-world-map/index.html
spec: zoomable-world-map
---

A world map that pans and zooms in response to mouse drag and scroll wheel input. This example applies an inverse map projection (using Vega's [invert](../../docs/expressions/#invert) expression function) to map changes in pixel space to updated projection parameters.

{% include example spec=page.spec %}

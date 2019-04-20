---
layout: example
title: Earthquakes Example
permalink: /examples/earthquakes/index.html
spec: earthquakes
image: /examples/img/earthquakes.png
---

A globe visualization of earthquakes reported by the [USGS](https://earthquake.usgs.gov/earthquakes/) for the week of February 6, 2018. The earthquakes are formatted as GeoJSON data, and the [geoshape](../../docs/transforms/geoshape) transform's _pointRadius_ parameter is used to visualize earthquake magnitude as a circular area. This example is based on Jeremy Ashkenas' [USGS World Earthquake Map](https://beta.observablehq.com/@jashkenas/quakespotter-0-1).

{% include example spec=page.spec %}

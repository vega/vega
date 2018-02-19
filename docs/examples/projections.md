---
layout: example
title: Projections Example
permalink: /examples/projections/index.html
spec: projections
image: /examples/img/projections.png
---

A gallery of world maps using various [cartographic projections](../../docs/projections). Each map clips the projected land masses and graticules to the sphere of the Earth to ensure no extraneous shapes are shown. This example uses projections from the [d3-geo-projection](https://github.com/d3/d3-geo-projection) library that are not included in the standard Vega release. View the source code of this page to see how the projections were registered for use with Vega!

{% include projections %}
{% include example spec=page.spec %}

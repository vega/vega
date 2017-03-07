---
layout: example
title: Distortion Comparison Example
permalink: /examples/distortion-comparison/index.html
spec: distortion-comparison
---

This example visualizes the difference in projected area of countries using two different map projections. Each country is abstracted to a circle, sized by the area of that country under a particular map projection. Country circles are positioned based on the centroid position of the country under a primary projection. A second set of circles are then overlaid, with projected areas based on a secondary projection. This example demonstrates Vega's [geoArea](../../docs/expressions/#geoArea) and [geoCentroid](../../docs/expressions/#geoCentroid) expression language functions.

{% include example spec=page.spec %}

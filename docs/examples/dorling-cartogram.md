---
layout: example
title: Dorling Cartogram Example
permalink: /examples/dorling-cartogram/index.html
spec: dorling-cartogram
---

A Dorling cartogram is a thematic map that uses sized circles to represent a quantity of interest per geographic region. This example visualizes the ratio of obese adults (BMI >= 30) by U.S. state in 2008. A redundant encoding uses both circle area and fill color to convey the obesity rate. Vega's [force](../../docs/transforms/force) transform and [geoCentroid](../../docs/expressions/#geoCentroid) expression function are used to compute the layout.

{% include example spec=page.spec %}

---
layout: example
title: Line Chart Example
permalink: /examples/line-chart/index.html
spec: line-chart
---

Line charts are used to depict changing values, with line slopes conveying rates of change. Different interpolators change the curvature of the line. Options such as [cardinal](https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Cardinal_spline) or [Catmull-Rom](https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Catmull.E2.80.93Rom_spline) interpolation can produce pleasing curves, but can also "hallucinate" maximum or minimum values that do not exist in the data. Use [monotone interpolation](https://en.wikipedia.org/wiki/Monotone_cubic_interpolation) for smooth curves that faithfully preserve monotonicity.

{% include example spec=page.spec %}

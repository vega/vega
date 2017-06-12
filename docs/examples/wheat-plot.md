---
layout: example
title: Wheat Plot Example
permalink: /examples/wheat-plot/index.html
spec: wheat-plot
---

A [wheat plot](http://www.perceptualedge.com/articles/visual_business_intelligence/the_datavis_jitterbug.pdf) is an alternative to standard dot plots and histograms that incorporates aspects of both. The x-coordinate of a point is based on its exact value. The y-coordinate is determined by grouping points into histogram bins, then stacking them based on their rank order within each bin. While not scalable to large numbers of data points, wheat plots allow inspection of (and interaction with) individual points without overplotting. For a related approach, see [beeswarm plots](../beeswarm-plot/).

{% include example spec=page.spec %}

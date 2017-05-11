---
layout: example
title: Binned Scatter Plot Example
permalink: /examples/binned-scatter-plot/index.html
spec: binned-scatter-plot
---

A binned scatter plot is a more scalable alternative to the [standard scatter plot](../scatter-plot). The data points are grouped into bins, and an aggregate statistic is used to summarize each bin. Here we use a circular area encoding to depict the count of records, visualizing the density of data points. For higher bin counts color might instead be used, though with some loss of perceptual comparison accuracy.

{% include example spec=page.spec %}

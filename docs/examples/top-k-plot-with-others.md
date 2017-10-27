---
layout: example
title: Top-K Plot With Others Example
permalink: /examples/top-k-plot-with-others/index.html
spec: top-k-plot-with-others
image: /examples/img/top-k-plot-with-others.png
---

A plot of the top-k film directors, plus all other directors, by aggregate worldwide gross. Unlike the [Top-K Plot](../top-k-plot/) example, this chart includes a category of all other directors aggregated together. The visualization spec first computes aggregates for all directors and ranks them. It then copies these ranks back to the source data using a [`lookup` transform](../../docs/transforms/lookup/), and determines which directors belong in the "other" category before performing a final aggregation.

{% include example spec=page.spec %}

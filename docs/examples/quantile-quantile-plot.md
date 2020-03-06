---
layout: example
title: Quantile-Quantile Plot Example
permalink: /examples/quantile-quantile-plot/index.html
spec: quantile-quantile-plot
image: /examples/img/quantile-quantile-plot.png
---

A [quantile-quantile (or Q-Q) plot](https://en.wikipedia.org/wiki/Q%E2%80%93Q_plot) visually compares two probability distributions by plotting a set of matching [quantile](https://en.wikipedia.org/wiki/Quantile) values for both. For example, plotting the corresponding 1st, 2nd, 3rd, _etc._, percentiles for each distribution. Q-Q plots are often used to plot an empirical data distribution against a theoretical distribution. If the two distributions are similar, they will lie along a line; notable deviations from a line are evidence of different distribution functions.

This example compares an empirical sample against two theoretical distributions. Change the input data source (samples from normal or uniform distributions) to observe how different samples compare with the theoretical distributions. The [quantile](../../docs/transforms/quantile) transform produces quantile values for input data; the [quantileUniform](../../docs/expressions/#quantileUniform) and [quantileNormal](../../docs/expressions/#quantileNormal) expression functions produce the theoretical quantile values.

{% include example spec=page.spec %}

---
layout: example
title: Dot Plot Example
permalink: /examples/dot-plot/index.html
spec: dot-plot
image: /examples/img/dot-plot.png
---

A [dot plot](https://en.wikipedia.org/wiki/Dot_plot_%28statistics%29) visualizes a univariate distribution by showing each value as a dot and stacking dots that overlap. Dot positions may be determined using standard histogram binning or with a ["dot density" estimator](https://www.cs.uic.edu/~wilkinson/Publications/dotplots.pdf) that tries to place dots close to their true values.

The example below includes both a density dot plot and a histogram dot plot, showing the hours of slow-wave (non-dreaming) sleep per day among 48 animals (from [Allison &amp; Cicchetti, 1976](http://lib.stat.cmu/datasets/sleep)). The dot size is meaningful along both the x- and y-axes, and the dot area and y-axis scale are calculated according to the underlying bin step size (dot diameter). Depending on the dot plot type, either a [dotbin](../../docs/transforms/dotbin) or [bin](../../docs/transforms/bin) transform is used to determine the x-axis positions, followed by a [stack](../../docs/transforms/stack) transform to calculate the y-axis positions.

{% include example spec=page.spec %}

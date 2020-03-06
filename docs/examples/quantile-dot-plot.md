---
layout: example
title: Quantile Dot Plot Example
permalink: /examples/quantile-dot-plot/index.html
spec: quantile-dot-plot
image: /examples/img/quantile-dot-plot.png
---

A [quantile dot plot](https://github.com/mjskay/when-ish-is-my-bus/blob/master/quantile-dotplots.md) represents a probability distribution by taking a uniform sample of quantile values and plotting them in a dot plot. It visualizes a representative set of _possible outcomes_ of a random process, and provides a discrete alternative to [probability density](../probability-density) and [violin plots](../violin-plot) in which finding probability intervals reduces to counting dots in the display.

The plot below visualizes quantiles for a log-normal distribution that models hypothetical bus arrival times (in minutes from the current time), following the example of [Kay, Kola, Hullman, &amp; Munson, 2016](http://dx.doi.org/10.1145/2858036.2858558). If we are willing to miss a bus 2 out of 20 times, given 20 quantiles we can count up 2 dots from the left to get the time we should arrive at the bus stop.

_Click or drag on the chart to explore risk thresholds for arriving at the bus stop. Double-click to remove the threshold._

{% include example spec=page.spec %}

---
layout: example
title: Loess Regression Example
permalink: /examples/loess-regression/index.html
spec: loess-regression
image: /examples/img/loess-regression.png
---

[Locally-estimated regression](https://en.wikipedia.org/wiki/Local_regression) produces a trend line by performing weighted regressions over a sliding window of points. The `loess` method (for *lo*cally-*e*stimated *s*catterplot *s*moothing) computes a sequence of local linear regressions to estimate smoothed points. The bandwidth parameter determines the size of the sliding window of nearest-neighbor points, expressed as a fraction of the total number of points included. Alternatively, see the [regression](../regression) example for regression results using parametric functions.

{% include example spec=page.spec %}

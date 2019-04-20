---
layout: example
title: Hypothetical Outcome Plots (HOPs) Example
permalink: /examples/hypothetical-outcome-plots/index.html
spec: hypothetical-outcome-plots
image: /examples/img/hypothetical-outcome-plots.png
---

Rather than showing a continuous probability distribution, [Hypothetical Outcome Plots (or HOPs)](https://medium.com/hci-design-at-uw/hypothetical-outcomes-plots-experiencing-the-uncertain-b9ea60d7c740) visualize a set of draws from a distribution, where each draw is shown as a new plot in either a small multiples or animated form. Here we use Vega's [`timer` event](https://vega.github.io/vega/docs/event-streams/) to produce animated frames.

This example &ndash; [inspired by The New York Times](https://www.nytimes.com/2014/05/02/upshot/how-not-to-be-misled-by-the-jobs-report.html) &ndash; displays random draws for a simulated time-series of values (these could be sales or employment statistics). The _noise_ signal determines the amount of random variation added to the signal. The _trend_ signal determines the strength of a linear trend, where zero corresponds to no trend at all (a flat uniform distribution). When the noise is high enough, draws from a distribution without any underlying trend may cause us to "hallucinate" interesting variations! Viewing the different frames may help viewers get a more visceral sense of random variation.

{% include example spec=page.spec %}

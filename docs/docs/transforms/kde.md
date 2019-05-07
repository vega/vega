---
layout: transform
title: KDE Transform
permalink: /docs/transforms/kde/index.html
---

The **kde** transform performs one-dimensional [kernel density estimation](https://en.wikipedia.org/wiki/Kernel_density_estimation) over an input data stream and generates uniformly-spaced samples of the estimated densities. Unlike the related [density](../density) transform, this transform supports groupby functionality and also scaling of densities to convey either probabilities or smoothed counts.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| value               | {% include type t="Field" %}    | The data field for which to perform density estimation.|
| groupby             | {% include type t="Field[]" %}  | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| method              | {% include type t="String" %}   | The type of distribution to estimate. One of `pdf` (default, for a probability distribution function) or `cdf` (for cumulative distribution function).|
| counts              | {% include type t="Boolean" %}  | A boolean flag indicating if the output values should be probability estimates (`false`, default) or smoothed counts (`true`).|
| bandwidth           | {% include type t="Number" %}   | An optional parameter that determines the width of the Gaussian kernel. If set to `0` (the default), the bandwidth value is automatically estimated from the input data using [Scott's method](https://stats.stackexchange.com/questions/90656/kernel-bandwidth-scotts-vs-silvermans-rules).|
| extent              | {% include type t="Number[]" %} | A _[min, max]_ domain from which to sample the distribution. If unspecified, the extent will be determined by the minimum and maximum values of the observed _value_ field.|
| steps               | {% include type t="Number" %}   | The number of uniformly spaced steps to take along the _extent_ domain (default `100`). A total of _steps + 1_ uniformly-spaced samples are drawn from the distribution.|
| as                  | {% include type t="String[]" %} | The output fields for the sample value and associated probability. The default is `["value", "density"]`.|

## Usage

```json
{
  "type": "kde",
  "groupby": ["key"],
  "field": "value"
}
```

Performs kernel density estimation (with automatically-selected bandwidth) over the numbers in the field `value` in the input data stream, with separate density estimates across groups defined by the `key` field.

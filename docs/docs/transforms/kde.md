---
layout: transform
title: KDE Transform
permalink: /docs/transforms/kde/index.html
---

The **kde** transform {% include tag ver="5.4" %} performs one-dimensional [kernel density estimation](https://en.wikipedia.org/wiki/Kernel_density_estimation) over an input data stream and generates uniformly-spaced samples of the estimated densities. Unlike the related [density](../density) transform, this transform supports groupby functionality and also scaling of densities to convey either probabilities or smoothed counts.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| field               | {% include type t="Field" %}    | {% include required %} The data field for which to perform density estimation.|
| groupby             | {% include type t="Field[]" %}  | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| cumulative          | {% include type t="Boolean" %}  | A boolean flag indicating whether to produce density estimates (`false`, default) or cumulative density estimates (`true`).
| counts              | {% include type t="Boolean" %}  | A boolean flag indicating if the output values should be probability estimates (`false`, default) or smoothed counts (`true`).|
| bandwidth           | {% include type t="Number" %}   | An optional parameter that determines the width of the Gaussian kernel. If set to `0` (the default), the bandwidth value is automatically estimated from the input data using [Scott's method](https://stats.stackexchange.com/questions/90656/kernel-bandwidth-scotts-vs-silvermans-rules).|
| extent              | {% include type t="Number[]" %} | A _[min, max]_ domain from which to sample the distribution. If unspecified, the extent will be determined by the minimum and maximum values of the observed _value_ field.|
| minsteps            | {% include type t="Number" %}   | The minimum number of samples (default 25) to take along the _extent_ domain for plotting the density.|
| maxsteps            | {% include type t="Number" %}   | The maximum number of samples (default 200) to take along the _extent_ domain for plotting the density.|
| resolve            | {% include type t="String" %}   | Indicates how parameters for multiple densities should be resolved. If `"independent"` (the default), each density may have its own domain *extent* and dynamic number of curve sample *steps*. If `"shared"`, the KDE transform will ensure that all densities are defined over a shared domain and curve steps, enabling stacking. {% include tag ver="5.5" %}|
| steps               | {% include type t="Number" %}   | The exact number of samples to take along the _extent_ domain for plotting the density. If specified, overrides both _minsteps_ and _maxsteps_ to set an exact number of uniform samples. Potentially useful in conjunction with a fixed extent to ensure consistent sample points for stacked densities.|
| as                  | {% include type t="String[]" %} | The output fields for the sample value and associated probability. The default is `["value", "density"]`.|

## Usage

Performs kernel density estimation (with automatically-selected bandwidth) over the numbers in the field `value` in the input data stream, with separate density estimates across groups defined by the `key` field:

```json
{
  "type": "kde",
  "groupby": ["key"],
  "field": "value"
}
```

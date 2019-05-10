---
layout: transform
title: Density Transform
permalink: /docs/transforms/density/index.html
---

The **density** transform generates a new data stream of uniformly-spaced samples drawn from a one-dimensional [probability density function (pdf)](https://en.wikipedia.org/wiki/Probability_density_function) or [cumulative distribution function (cdf)](https://en.wikipedia.org/wiki/Cumulative_distribution_function). This transform is useful for representing probability distributions and generating continuous distributions from discrete samples using [kernel density estimation](https://en.wikipedia.org/wiki/Kernel_density_estimation).

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| distribution        | [Distribution](#distributions)  | {% include required %} An object describing the distribution type and parameters. See the  [distribution reference](#distributions) for more.|
| extent              | {% include type t="Number[]" %} | A _[min, max]_ domain from which to sample the distribution. This argument is required in most cases, but can be omitted in the case of distributions (namely, `kde`) that can deduce their own extent.|
| method              | {% include type t="String" %}   | The type of distribution to generate. One of `pdf` (default) or `cdf`.|
| minsteps            | {% include type t="Number" %}   | The minimum number of samples (default 25) to take along the _extent_ domain for plotting the density. {% include tag ver="5.4" %} |
| maxsteps            | {% include type t="Number" %}   | The maximum number of samples (default 200) to take along the _extent_ domain for plotting the density. {% include tag ver="5.4" %} |
| steps               | {% include type t="Number" %}   | The exact number of samples to take along the _extent_ domain for plotting the density. If specified, overrides both _minsteps_ and _maxsteps_ to set an exact number of uniform samples. Potentially useful in conjunction with a fixed extent to ensure consistent sample points for stacked densities.|
| as                  | {% include type t="String[]" %} | The output fields for the sample value and associated probability. The default is `["value", "density"]`.|


## <a name="distributions"></a>Distribution Reference

<a name="normal" href="#normal">#</a>
<b>normal</b>

Represents a [normal (Gaussian) probability distribution](https://en.wikipedia.org/wiki/Normal_distribution) with a specified _mean_ and standard deviation _stdev_.

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| function            | {% include type t="String" %}  | The value `"normal"`.|
| mean                | {% include type t="Number" %}  | The mean of the distribution (default `0`).|
| stdev               | {% include type t="Number" %}  | The standard deviation of the distribution (default `1`).|


<a name="uniform" href="#uniform">#</a>
<b>uniform</b>

Represents a [continuous uniform probability distribution](https://en.wikipedia.org/wiki/Uniform_distribution_(continuous)) over the interval _[min, max)_.

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| function            | {% include type t="String" %}  | The value `"uniform"`.|
| min                 | {% include type t="Number" %}  | The minimum value (default `0`).|
| max                 | {% include type t="Number" %}  | The maximum value (default `1`).|


<a name="kde" href="#kde">#</a>
<b>kde</b>

Represents a [kernel density estimate](https://en.wikipedia.org/wiki/Kernel_density_estimation)
for a set of numerical values. This method uses a Gaussian kernel to estimate a smoothed, continuous probability distribution.

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| function            | {% include type t="String" %}  | The value `"kde"`.|
| from                | {% include type t="Data" %}    | The name of the data set to analyze.|
| field               | {% include type t="Field" %}   | The data field containing the values to model.|
| bandwidth           | {% include type t="Number" %}  | An optional parameter that determines the width of the Gaussian kernel. If set to `0` (the default), the bandwidth value will be automatically estimated from the input data.|

<a name="mixture" href="#mixture">#</a>
<b>mixture</b>

Represents a (weighted) mixture of probability distributions. The _distributions_ argument should be an array of distribution objects. The optional _weights_ array provides proportional numerical weights for each distribution.

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| function            | {% include type t="String" %}   | The value `"mixture"`.|
| distributions       | {% include array t="[Distribution](#distributions)" %} | An array of distribution definition objects.|
| weights             | {% include type t="Number[]" %} | An optional array of weights for each distribution.If provided, the values will be normalized to ensure that weights sum to 1. Any unspecified weight values default to `1` prior to normalization.|

## Usage

```json
{
  "type": "density",
  "extent": [0, 10],
  "distribution": {
    "function": "normal",
    "mean": 5,
    "stdev": 2
  }
}
```

Generates a data stream of data objects drawn from a normal distribution with mean 5 and standard deviation 2, sampling 100 steps along the domain `[0, 10]`.

```json
{
  "type": "density",
  "steps": 200,
  "distribution": {
    "function": "kde",
    "from": "table",
    "field": "value"
  }
}
```

Performs kernel density estimation (with automatically-selected bandwidth) over the numbers in the field `value` in the data stream named `table`. Generates a data stream by drawing 200 uniformly-spaced samples between the minimum and maximum observed data value.

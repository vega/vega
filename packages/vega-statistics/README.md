# vega-statistics

Statistical routines and probability distributions.

## API Reference

- [Random Number Generation](#random-number-generation)
- [Distributions](#distributions)
- [Statistics](#statistics)

### Random Number Generation

<a name="random" href="#random">#</a>
vega.<b>random</b>()
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/random.js "Source")

Returns a uniform pseudo-random number in the domain [0, 1). By default this is simply a call to JavaScript's built-in `Math.random` function. All Vega routines that require random numbers should use this function.

<a name="setRandom" href="#setRandom">#</a>
vega.<b>setRandom</b>(<i>randfunc</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/random.js "Source")

Sets the random number generator to the provided function _randfunc_. Subsequent calls to <a href="#random">random</a> will invoke the new function to generate random numbers. Setting a custom generator can be helpful if one wishes to use an alternative source of randomness or replace the default generator with a deterministic function for testing purposes.

<a name="randomLCG" href="#randomLCG">#</a>
vega.<b>randomLCG</b>(<i>seed</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/lcg.js "Source")

Returns a new random number generator with the given random _seed_. The returned function takes zero arguments and generates random values in the domain [0, 1) using a [linear congruential generator (LCG)](https://en.wikipedia.org/wiki/Linear_congruential_generator). This method is helpful in conjunction with [setRandom](#setRandom) to provide seeded random numbers for stable outputs and testing.

### Distributions

Methods for sampling and calculating probability distributions. Each method takes a set of distributional parameters and returns a distribution object representing a random variable.

Distribution objects expose the following methods:

- dist.<b>sample</b>(): Samples a random value drawn from this distribution.
- dist.<b>pdf</b>(<i>value</i>): Calculates the value of the [probability density function](https://en.wikipedia.org/wiki/Probability_density_function) at the given input domain *value*.
- dist.<b>cdf</b>(<i>value</i>): Calculates the value of the [cumulative distribution function](https://en.wikipedia.org/wiki/Cumulative_distribution_function) at the given input domain *value*.
- dist.<b>icdf</b>(<i>probability</i>): Calculates the inverse of the [cumulative distribution function](https://en.wikipedia.org/wiki/Cumulative_distribution_function) for the given input *probability*.

<a name="randomNormal" href="#randomNormal">#</a>
vega.<b>randomNormal</b>([<i>mean</i>, <i>stdev</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/normal.js "Source")

Creates a distribution object representing a [normal (Gaussian) probability distribution](https://en.wikipedia.org/wiki/Normal_distribution) with specified *mean* and standard deviation *stdev*. If unspecified, the mean defaults to `0` and the standard deviation defaults to `1`.

Once created, *mean* and *stdev* values can be accessed or modified using the `mean` and `stdev` getter/setter methods.

<a name="randomUniform" href="#randomUniform">#</a>
vega.<b>randomUniform</b>([<i>min</i>, <i>max</i>])
[<>](https://github.com/vega/vega-statistics/blob/master/src/uniform.js "Source")

Creates a distribution object representing a [continuous uniform probability distribution](https://en.wikipedia.org/wiki/Uniform_distribution_(continuous)) over the interval [*min*, *max*). If unspecified, *min* defaults to `0` and *max* defaults to `1`. If only one argument is provided, it is interpreted as the *max* value.

Once created, *min* and *max* values can be accessed or modified using the `min` and `max` getter/setter methods.

<a name="randomInteger" href="#randomInteger">#</a>
vega.<b>randomInteger</b>([<i>min</i>,] <i>max</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/integer.js "Source")

Creates a distribution object representing a [discrete uniform probability distribution](https://en.wikipedia.org/wiki/Discrete_uniform_distribution) over the integer domain [*min*, *max*). If only one argument is provided, it is interpreted as the *max* value. If unspecified, *min* defaults to `0`.

Once created, *min* and *max* values can be accessed or modified using the `min` and `max` getter/setter methods.

<a name="randomMixture" href="#randomMixture">#</a>
vega.<b>randomMixture</b>(<i>distributions</i>[, <i>weights</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/mixture.js "Source")

Creates a distribution object representing a (weighted) mixture of probability distributions. The *distributions* argument should be an array of distribution objects. The optional *weights* array provides proportional numerical weights for each distribution. If provided, the values in the *weights* array will be normalized to ensure that weights sum to 1. Any unspecified weight values default to `1` (prior to normalization). Mixture distributions do **not** support the `icdf` method: calling `icdf` will result in an error.

Once created, the *distributions* and *weights* arrays can be accessed or modified using the `distributions` and `weights` getter/setter methods.

<a name="randomKDE" href="#randomKDE">#</a>
vega.<b>randomKDE</b>(<i>values</i>[, <i>bandwidth</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/kde.js "Source")

Creates a distribution object representing a [kernel density estimate](https://en.wikipedia.org/wiki/Kernel_density_estimation) for an array of numerical *values*. This method uses a Gaussian kernel to estimate a smoothed, continuous probability distribution. The optional *bandwidth* parameter determines the width of the Gaussian kernel. If the *bandwidth* is either `0` or unspecified, a default bandwidth value will be automatically estimated based on the input data. KDE distributions do **not** support the `icdf` method: calling `icdf` will result in an error.

Once created, *data* and *bandwidth* values can be accessed or modified using the `data` and `bandwidth` getter/setter methods.

### Statistics

Statistical methods for calculating bins, bootstrapped confidence intervals, and quartile boundaries.

<a name="bin" href="#bin">#</a>
vega.<b>bin</b>(<i>options</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/bin.js "Source")

Determine a quantitative binning scheme, for example to create a histogram. Based on the options provided given, this method will search over a space of possible bins, aligning step sizes with a given number base and applying constraints such as the maximum number of allowable bins. Given a set of options (see below), returns an object describing the binning scheme, in terms of `start`, `stop`, and `step` properties.

The supported options properties are:

- _extent_: (required) A two-element (`[min, max]`) array indicating the range of desired bin values.
- _base_: The number base to use for automatic bin determination (default base `10`).
- _maxbins_: The maximum number of allowable bins (default `20`).
- _step_: An exact step size to use between bins. If provided, the _maxbins_ and _steps_ options will be ignored.
- _steps_: An array of allowable step sizes to choose from. If provided, the _maxbins_ option will be ignored.
- _minstep_: A minimum allowable step size (particularly useful for integer values, default `0`).
- _divide_: An array of scale factors indicating allowable subdivisions. The default value is `[5, 2]`, which indicates that the method may consider dividing bin sizes by 5 and/or 2. For example, for an initial step size of 10, the method can check if bin sizes of 2 (= 10/5), 5 (= 10/2), or 1 (= 10/(5*2)) might also satisfy the given constraints.
- _nice_: Boolean indicating if the start and stop values should be nicely-rounded relative to the step size (default `true`).

```js
vega.bin({extent:[0, 1], maxbins:10}); // {start:0, stop:1, step:0.1}
vega.bin({extent:[0, 1], maxbins:5}); // {start:0, stop:10, step:2}
vega.bin({extent:[5, 10], maxbins:5}); // {start:5, stop:10, step:1}
```

<a name="bootstrapCI" href="#bootstrapCI">#</a>
vega.<b>bootstrapCI</b>(<i>array</i>, <i>samples</i>, <i>alpha</i>[, <i>accessor</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/bootstrapCI.js "Source")

Calculates a [bootstrapped](https://en.wikipedia.org/wiki/Bootstrapping_(statistics)) [confidence interval](https://en.wikipedia.org/wiki/Confidence_interval) for an input *array* of values, based on a given number of *samples* iterations and a target *alpha* value. For example, an *alpha* value of `0.05` corresponds to a 95% confidence interval An optional *accessor* function can be used to first extract numerical values from an array of input objects, and is equivalent to first calling `array.map(accessor)`. This method ignores null, undefined, and NaN values.

<a name="quartiles" href="#quartiles">#</a>
vega.<b>quartiles</b>(<i>array</i>[, <i>accessor</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-statistics/src/quartiles.js "Source")

Given an *array* of numeric values, returns an array of [quartile](https://en.wikipedia.org/wiki/Quartile) boundaries. The return value is a 3-element array consisting of the first, second (median), and third quartile boundaries. An optional *accessor* function can be used to first extract numerical values from an array of input objects, and is equivalent to first calling `array.map(accessor)`. This method ignores null, undefined and NaN values.

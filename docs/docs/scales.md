---
layout: spec
title: Scales
permalink: /docs/scales/index.html
---

**Scales** map data values (numbers, dates, categories, _etc._) to visual values (pixels, colors, sizes). Scales are a fundamental building block of data visualization, as they determine the nature of visual encodings. Vega includes a range of scales for both continuous and discrete input data, and supports mappings for position, shape, size and color encodings.

To visualize scales, Vega specifications may include [axes](../axes) or [legends](../legends). For more about supported color encodings, see the [color scheme reference](../schemes). Internally, Vega uses the scales provided by the [d3-scale](https://github.com/d3/d3-scale) library; for more background see [Introducing d3-scale](https://medium.com/@mbostock/introducing-d3-scale-61980c51545f) by Mike Bostock.

## Documentation Overview

- [Scale Properties](#properties)
- [Scale Types](#types)
- [Scale Domains](#domain)
- [Scale Ranges](#range)


## <a name="properties"></a>Scale Properties

Properties shared across scale types.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| name          | {% include type t="String" %}  | {% include required %} A unique name for the scale. Scales and [projections](../projections) share the same namespace; names must be unique across both.|
| type          | {% include type t="String" %}  | The type of scale (default `linear`). See the  [scale type reference](#types) for more.|
| domain        | [Domain](#domain)              | The domain of input data values for the scale. For quantitative data, this can take the form of a two-element array with minimum and maximum values. For ordinal or categorical data, this may be an array of valid input values. The domain may also be specified as a reference to a data source. See the [scale domain reference](#domain) for more.|
| domainMax     | {% include type t="Number" %}  | Sets the maximum value in the scale domain, overriding the _domain_ property. The _domainMax_ property is only intended for use with scales having continuous domains.|
| domainMin     | {% include type t="Number" %}  | Sets the minimum value in the scale domain, overriding the _domain_ property. The _domainMin_ property is only intended for use with scales having continuous domains.|
| domainMid     | {% include type t="Number" %}  | Inserts a single mid-point value into a two-element domain. The mid-point value must lie between the domain minimum and maximum values. This property can be useful for setting a midpoint for [diverging color scales](../schemes/#diverging). The _domainMid_ property is only intended for use with scales supporting continuous, piecewise domains.|
| domainRaw     | {% include type t="Array" %}   | An array of raw values that, if non-null, directly overrides the _domain_ property. This is useful for supporting interactions such as panning or zooming a scale. The scale may be initially determined using a data-driven _domain_, then modified in response to user input by setting the _rawDomain_ value.|
| interpolate   | {% include type t="String|Object" %}  | The interpolation method for range values. By default, continuous scales use a general interpolator for numbers, dates, strings and colors (in RGB space) is used. For color ranges, this property allows interpolation in alternative color spaces. Legal values include `rgb`, `hsl`, `hsl-long`, `lab`, `hcl`, `hcl-long`, `cubehelix` and `cubehelix-long` ('-long' variants use longer paths in polar coordinate spaces). If object-valued, this property accepts an object with a string-valued _type_ property and an optional numeric _gamma_ property applicable to rgb and cubehelix interpolators. For more, see the [d3-interpolate documentation](https://github.com/d3/d3-interpolate).|
| range         | [Range](#range)                | The range of the scale, representing the set of visual values. For numeric values, the range typically takes the form of a two-element array with minimum and maximum values. For ordinal or quantized data, the range may be an array of desired output values, which are mapped to elements in the specified domain. See the [scale range reference](#range) for more.|
| reverse       | {% include type t="Boolean" %} | A boolean flag (default `false`) that reverses the order of the scale range.|
| round         | {% include type t="Boolean" %} | A boolean flag (default `false`) that rounds numeric output values to integers. Helpful for snapping to a pixel grid.|


## <a name="types"></a>Scale Types

- [**Quantitative Scales**](#quantitative)
  - [`linear`](#linear)
  - [`log`](#log)
  - [`pow`](#pow)
  - [`sqrt`](#sqrt)
  - [`symlog`](#symlog)
  - [`time`](#time)
  - [`utc`](#utc)
  - [`sequential`](#sequential)
- [**Discrete Scales**](#discrete)
  - [`ordinal`](#ordinal)
  - [`band`](#band)
  - [`point`](#point)
- [**Discretizing Scales**](#discretizing)
  - [`quantile`](#quantile)
  - [`quantize`](#quantize)
  - [`threshold`](#threshold)
  - [`bin-ordinal`](#bin-ordinal)
{: .column-set}

## <a name="quantitative"></a>Quantitative Scales

A quantitative scale maps a continuous domain (numbers or dates) to a continuous output range (pixel locations, sizes, colors). The available quantitative scale _type_ values are [`linear`](#linear), [`log`](#log), [`pow`](#pow), [`sqrt`](#sqrt), [`symlog`](#symlog), [`time`](#time) and [`utc`](#utc). All quantitative scales except for `time` and `utc` use a default _domain_ of [0, 1] and default unit _range_ [0, 1].

All quantitative scales support color-valued ranges, defined either as an array of color strings or as a [scheme](../scheme) specification. If the domain includes two color values, a sequential color scale is used. If the domain includes three color values, a diverging color scale is used. For larger domain sizes, the domain and range should have the same number of values, over which piecewise interpolation will be applied.

| Property      | Type                                  | Description    |
| :------------ | :-----------------------------------: | :------------- |
| bins          | [Bins](#bins)                         | {% include tag ver="5.0" %} Bin boundaries over the scale domain, such as those computed by Vega's [`bin` transform](../transforms/bin). If provided, axes and legends will use the bin boundaries to inform the choice of axis tick marks and legend labels. This property can be either an explicit array of bin boundary values or a specification object, see the [scale bins reference](#bins) for more.|
| clamp         | {% include type t="Boolean" %}        | A boolean indicating if output values should be clamped to the _range_ (default `false`). If clamping is disabled and the scale is passed a value outside the _domain_, the scale may return a value outside the _range_ through extrapolation. If clamping is enabled, the output value of the scale is always within the scale's range.|
| padding       | {% include type t="Number" %}         | Expands the scale domain to accommodate the specified number of pixels on each of the scale range. The scale range must represent pixels for this parameter to function as intended. Padding adjustment is performed _prior_ to all other adjustments, including the effects of the _zero_, _nice_, _domainMin_, and _domainMax_ properties.|
| nice          | {% include type t="Boolean|Number" %} | Extends the domain so that it starts and ends on nice round values (default `false`). This method typically modifies the scale's domain, and may only extend the bounds to the nearest round value. Nicing is useful if the domain is computed from data and may be irregular. For example, for a domain of [0.201479…, 0.996679…], a nice domain might be [0.2, 1.0]. Domain values set via _domainMin_ and _domainMax_ (but **not** _domainRaw_) are subject to nicing. Using a number value for this parameter (representing a desired tick count) allows greater control over the step size used to extend the bounds, guaranteeing that the returned ticks will exactly cover the domain.|
| zero          | {% include type t="Boolean" %}        | Boolean flag indicating if the scale domain should include zero. The default value is `true` for `linear`, `sqrt` and `pow`, and `false` otherwise.|

### <a name="linear"></a>Linear Scales

Linear scales (`linear`) are [quantitative scales](#quantitative) scales that preserve proportional differences. Each range value _y_ can be expressed as a linear function of the domain value _x_: _y = mx + b_.

### <a name="log"></a>Logarithmic Scales

Log scales (`log`) are [quantitative scales](#quantitative) scales in which a logarithmic transform is applied to the input domain value before the output range value is computed. Log scales are particularly useful for plotting data that varies over multiple orders of magnitude. The mapping to the range value _y_ can be expressed as a logarithmic function of the domain value _x_: _y = m log(x) + b_.

As log(0) = -∞, a log scale domain must be strictly-positive or strictly-negative; the domain must not include or cross zero. A log scale with a positive domain has a well-defined behavior for positive values, and a log scale with a negative domain has a well-defined behavior for negative values. (For a negative domain, input and output values are implicitly multiplied by -1.) The behavior of the scale is undefined if you run a negative value through a log scale with a positive domain or vice versa.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| base          | {% include type t="Number" %}  | The base of the logarithm (default `10`).|

### <a name="pow"></a>Power Scales

Power scales (`pow`) are [quantitative scales](#quantitative) scales that apply an exponential transform to the input domain value before the output range value is computed. Each range value _y_ can be expressed as a polynomial function of the domain value _x_: _y = mx^k + b_, where _k_ is the exponent value. Power scales also support negative domain values, in which case the input value and the resulting output value are multiplied by -1.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| exponent      | {% include type t="Number" %}  | The exponent to use in the scale transform (default `1`).|

### <a name="sqrt"></a>Square Root Scales

Square root (`sqrt`) scales are a convenient shorthand for [power scales](#pow) with an exponent of `0.5`, indicating a square root transform.

### <a name="symlog"></a>Symmetric Log Scales {% include tag ver="5.0" %}

Symmetric log scales (`symlog`) are [quantitative scales](#quantitative) scales that provide scaling similar to log scales, but supports non-positive numbers. Symlog scales are particularly useful for plotting data that varies over multiple orders of magnitude but includes negative- or zero-valued data. For more, see ["A bi-symmetric log transformation for wide-range data"](https://www.researchgate.net/profile/John_Webber4/publication/233967063_A_bi-symmetric_log_transformation_for_wide-range_data/links/0fcfd50d791c85082e000000.pdf) by Webber for more.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| constant      | {% include type t="Number" %}  | A constant determining the slope of the symlog function around zero (default `1`).|

### <a name="time"></a>Time and <a name="utc"></a>UTC Scales

Time scales (`time` and `utc`) are [quantitative scales](#quantitative) with a temporal domain: values in the input domain are assumed to be [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) objects or timestamps. The `time` scale type uses the current local timezone setting. UTC scales (`utc`) instead use [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time). Both `time` and `utc` scales use a default _domain_ of [2000-01-01, 2000-01-02], and a default unit _range_ [0, 1].

| Property      | Type                                         | Description    |
| :------------ | :------------------------------------------: | :------------- |
| nice          | {% include type t="String|Object|Number|Boolean" %} | If specified, modifies the scale domain to use a more human-friendly value range. For `time` and `utc` scale types, the nice value can additionally be a string indicating the desired time interval. Legal values are `"millisecond"`, `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, and `"year"`. Alternatively, `time` and `utc` scales can accept an object-valued interval specifier of the form `{"interval": "month", "step": 3}`, which includes a desired number of interval steps. Here, the domain would snap to quarter (Jan, Apr, Jul, Oct) boundaries.|

### <a name="sequential"></a>Sequential Scales (Deprecated)

Sequential scales (`sequential`) are similar to [linear scales](#linear), but use a fixed interpolator to determine the output range. As of Vega 5.0, sequential scales are **deprecated**: *specifications should now use a `linear` (or `log`, etc.) scale with a color-valued range, rather than  a `sequential` scale*.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| clamp         | {% include type t="Boolean" %} | A boolean indicating if output values should be clamped to the _range_ (default `false`). If clamping is disabled and the scale is passed a value outside the _domain_, the scale may return a value outside the _range_ through extrapolation. If clamping is enabled, the output value of the scale is always within the scale's range.|
| domainMax     | {% include type t="Number" %}  | Sets the maximum value in the scale domain, overriding the _domain_ property.|
| domainMin     | {% include type t="Number" %}  | Sets the minimum value in the scale domain, overriding the _domain_ property.|
| domainMid     | {% include type t="Number" %}  | Inserts a single mid-point value into a two-element domain. The mid-point value must lie between the domain minimum and maximum values. This property can be useful for setting a midpoint for [diverging color scales](../schemes/#diverging).|
| range         | [Scheme](../schemes){% include or %}{% include type t="Color[]" %} | {% include required %} The _range_ value should either be a [color scheme](../schemes) object or an array of color strings. If an array of colors is provided, the array will be used to create a continuous interpolator via linear interpolation in the RGB color space.|

[Back to scale type reference](#types)


## <a name="discrete"></a>Discrete Scales

Discrete scales map values from a discrete domain to a discrete range. In the case of `band` and `point` scales, the range is determined by discretizing a continuous numeric range.

### <a name="ordinal"></a>Ordinal Scales

Ordinal scales (`ordinal`) have a discrete domain and range. For example, an ordinal scale might map a set of named categories to a set of colors, or to a set of shapes. Ordinal scales function as a "lookup table" from a domain value to a range value.

This example uses an ordinal scale for color-coded categories, with up to 20 unique colors:

```json
{
  "scales": [
    {
      "name": "color",
      "type": "ordinal",
      "domain": {"data": "table", "field": "category"},
      "range": {"scheme": "category20"}
    }
  ]
}
```

### <a name="band"></a>Band Scales

Band scales (`band`) accept a discrete domain similar to [ordinal scales](#ordinal), but map this domain to a continuous, numeric output range such as pixels. Discrete output values are automatically computed by the scale by dividing the continuous range into uniform _bands_. Band scales are typically used for bar charts with an ordinal or categorical dimension.

In addition to a standard numerical _range_ value (such as `[0, 500]`), band scales can be given a fixed _step_ size for each band. The actual range is then determined by both the step size and the cardinality (element count) of the input domain. The step size is specified by an object with a _step_ property that provides the step size in pixels, for example `"range": {"step": 20}`.

This image from the [d3-scale documentation](https://github.com/d3/d3-scale#band-scales) illustrates how a band scale works:

<img src="https://raw.githubusercontent.com/d3/d3-scale/master/img/band.png"/>

| Property      | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| align         | {% include type t="Number" %} | The alignment of elements within the scale range. This value must lie in the range [0,1]. A value of 0.5 (default) indicates that the bands should be centered within the range. A value of 0 or 1 may be used to shift the bands to one side, say to position them adjacent to an axis. For more, see [this explainer for D3 band align](https://observablehq.com/@d3/band-align). |
| domainImplicit| {% include type t="Boolean" %} | A boolean flag (default `false`) indicating if an ordinal domain should be implicitly extended with new values. If false, the scale will return `undefined` for values not explicitly included in the domain. If true, new values will be appended to the domain and the matching range value will be returned.|
| padding       | {% include type t="Number" %} | Sets _paddingInner_ and _paddingOuter_ to the same padding value (default `0`). This value must lie in the range [0,1].|
| paddingInner  | {% include type t="Number" %} | The inner padding (spacing) within each band step, as a fraction of the step size (default `0`). This value must lie in the range [0,1].|
| paddingOuter  | {% include type t="Number" %} | The outer padding (spacing) at the ends of the scale range, as a fraction of the step size (default `0`). This value must lie in the range [0,1].|


### <a name="point"></a>Point Scales

Point scales (`point`) are a variant of [band scales](#band) where the internal band width is fixed to zero. Point scales are typically used for scatterplots with an ordinal or categorical dimension. Similar to band scales, point scale _range_ values may be specified using either a numerical extent (`[0, 500]`) or a step size (`{"step": 20}`). As point scales do not have internal band widths (only step sizes between bands), they do not accept the _paddingInner_ property.

This image from the [d3-scale documentation](https://github.com/d3/d3-scale#band-scales) illustrates how a point scale works:

<img src="https://raw.githubusercontent.com/d3/d3-scale/master/img/point.png"/>

| Property      | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| align         | {% include type t="Number" %} | The alignment of elements within the scale range. This value must lie in the range [0,1]. A value of 0.5 (default) indicates that the points should be centered within the range. A value of 0 or 1 may be used to shift the points to one side, say to position them adjacent to an axis.|
| padding       | {% include type t="Number" %} | An alias for _paddingOuter_ (default `0`). This value must lie in the range [0,1].|
| paddingOuter  | {% include type t="Number" %} | The outer padding (spacing) at the ends of the scale range, as a fraction of the step size (default `0`). This value must lie in the range [0,1].|

[Back to scale type reference](#types)


## <a name="discretizing"></a>Discretizing Scales

Discretizing scales break up a continuous domain into discrete segments, and then map values in each segment to a range value.

### <a name="quantile"></a>Quantile Scales

Quantile scales (`quantile`) map a sample of input domain values to a discrete range based on computed [quantile](https://en.wikipedia.org/wiki/Quantile) boundaries. The domain is considered continuous and thus the scale will accept any reasonable input value; however, the domain is specified as a discrete set of sample values. The number of values in (_i.e._, the cardinality of) the output range determines the number of quantiles that will be computed from the domain. To compute the quantiles, the domain is sorted, and treated as a population of discrete values. The resulting quantile boundaries segment the domain into groups with roughly equal numbers of sample points per group.

Quantile scales are particularly useful for creating color or size encodings with a fixed number of output values. Using a discrete set of encoding levels (typically between 5-9 colors or sizes) sometimes supports more accurate perceptual comparison than a continuous range. For related functionality see [quantize scales](#quantize), which partition the domain into uniform domain extents, rather than groups with equal element counts. Quantile scales have the benefit of evenly distributing data points to encoded values. In contrast, quantize scales uniformly segment the input domain and provide no guarantee on how data points will be distributed among the output visual values.

This example color-codes quantile values in five groups, using colors sampled from a continuous color scheme:

```json
{
  "name": "color",
  "scale": "quantile",
  "domain": {"data": "table", "field": "value"},
  "range": {"scheme": "plasma", "count": 5}
}
```

### <a name="quantize"></a>Quantize Scales

Quantize scales (`quantize`) are similar to [linear scales](#linear), except they use a discrete rather than continuous range. The continuous input domain is divided into uniform segments based on the number of values in (_i.e._, the cardinality of) the output range. Each range value _y_ can be expressed as a quantized linear function of the domain value _x_: _y = m round(x) + b_.

Quantize scales are particularly useful for creating color or size encodings with a fixed number of output values. Using a discrete set of encoding levels (typically between 5-9 colors or sizes) sometimes supports more accurate perceptual comparison than a continuous range. For related functionality see [quantile scales](#quantile), which partition the domain into groups with equal element counts, rather than uniform domain extents.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| nice          | {% include type t="Boolean|Number" %} | Extends the domain so that it starts and ends on nice round values (default `false`). This method typically modifies the scale's domain, and may only extend the bounds to the nearest round value. Nicing is useful if the domain is computed from data and may be irregular. For example, for a domain of [0.201479…, 0.996679…], a nice domain might be [0.2, 1.0]. Domain values set via _domainMin_ and _domainMax_ (but **not** _domainRaw_) are subject to nicing. Using a number value for this parameter (representing a desired tick count) allows greater control over the step size used to extend the bounds, guaranteeing that the returned ticks will exactly cover the domain.|
| zero          | {% include type t="Boolean" %} | Boolean flag indicating if the scale domain should include zero (default `false`).|

This example color-codes a quantized domain using a 7-point color scheme:

```json
{
  "name": "color",
  "scale": "quantize",
  "domain": {"data": "table", "field": "value"},
  "range": {"scheme": "blues", "count": 7}
}
```

### <a name="threshold"></a>Threshold Scales

Threshold scales (`threshold`) are similar to [quantize scales](#quantize), except they allow mapping of _arbitrary_ subsets of the domain (not uniform segments) to discrete values in the range. The input domain is still continuous, and divided into slices based on a set of threshold values provided to the _domain_ property. The _range_ property must have N+1 elements, where N is the number of threshold boundaries provided in the _domain_.

Given the following scale definition,

```json
{
  "name": "threshold",
  "type": "threshold",
  "domain": [0, 1],
  "range": ["red", "white", "blue"]
}
```

the scale will map domain values to color strings as follows:

```
-1   => "red"
0    => "white"
0.5  => "white"
1.0  => "blue"
1000 => "blue"
```

### <a name="bin-ordinal"></a>Bin-Ordinal Scales

Binned ordinal scales (`bin-ordinal`) are a special type of [ordinal scale](#ordinal) for use with data that has been subdivided into bins (for example, using Vega's [`bin` transform](../transforms/bin)). The main benefit of using `bin-ordinal` scales is that they provide "bin-aware" routines for sampling values and generating labels for inclusion in [legends](../legends). They are particularly useful for creating binned color encodings.

The _domain_ values for a binned ordinal scale must be the set of all bin boundaries, from the minimum bin start to maximum bin end. Input domain values are discretized to the appropriate bin, which is then treated as a standard ordinal scale input. However, as the _domain_ property only accepts an array of values, the `bin-ordinal` scale provides a _bins_ property that also accepts a bin specification and can be used instead of an explicit _domain_ property.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| bins          | [Bins](#bins)                  | {% include tag ver="5.0" %} Bin boundaries over the scale domain, such as those computed by Vega's [`bin` transform](../transforms/bin). This property can be either an explicit array of bin boundary values or a specification object, see the [scale bins reference](#bins) for more. If the _domain_ property is not defined, *bins* will be used to determine the scale domain.|

Here is an example of a `bin-ordinal` scale defined in conjunction with a [`bin` transform](../transforms/bin):

```json
{
  "data": [
    {
      "name": "input",
      "transform": [
        { "type": "extent", "field": "value", "signal": "extent" },
        { "type": "bin", "extent": {"signal": "extent"}, "signal": "bins" }
      ]
    }
  ],
  "scales": [
    {
      "name": "color",
      "type": "bin-ordinal",
      "bins": {"signal": "bins"},
      "range": {"scheme": "greens"}
    }
  ]
}
```

[Back to scale type reference](#types)


## <a name="bins"></a>Scale Bins

Bin boundaries can be provided to scales as either an explicit array of bin boundaries or as a bin specification object. The legal values are:

- A [signal reference](../types/#Signal) that resolves to either an array or bin specification object.
- An [array](../types/#Array) literal of bin boundary values. For example, `[0, 5, 10, 15, 20]`. The array must include both starting and ending boundaries. The previous example uses five values to indicate a total of four bin intervals: [0-5), [5-10), [10-15), [15-20]. Array literals may include signal references as elements.
- A bin specification object that indicates the bin _step_ size, and optionally the _start_ and _stop_ boundaries. The output value of a [`bin` transform](../transforms/bin) is a valid bin specification object.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| start         | {% include type t="Number" %}  | The starting (lowest-valued) bin boundary. If not defined, the lowest value of the scale domain will be used.|
| stop          | {% include type t="Number" %}  | The stopping (highest-valued) bin boundary. If not defined, the highest value of the scale domain will be used.|
| step          | {% include type t="Number" %}  | {% include required %} The step size defining the bin interval width.|


## <a name="domain"></a>Scale Domains

Scale domains can be specified in multiple ways:

- As an [array](../types/#Array) literal of domain values. For example, `[0, 500]` or `['a', 'b', 'c']`. Array literals may include signal references as elements.
- A [signal reference](../types/#Signal) that resolves to a domain value array. For example, `{"signal": "myDomain"}`.
- A [data reference](#dataref) object that specifies field values in one or more data sets.

### <a name="dataref"></a>Basic Data Reference

A basic _data reference_ indicates a data set, field name, and optional sorting for discrete scales:

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| data          | {% include type t="String" %}  | {% include required %} The name of the data set containing domain values.|
| field         | {% include type t="Field" %}   | {% include required %} The name of the data field (e.g., `"price"`).|
| sort          | {% include type t="Boolean" %}{% include or %}[Sort](#sort) | If a boolean `true` value, sort the domain values in ascending order. If object-valued, sort the domain according to the provided [sort parameters](#sort). Sorting is only supported for [discrete scale types](#discrete).|

For example, `"domain": {"data": "table", "field": "value"}`, derives a scale domain from the `value` field of data objects in the `table` data set. If the scale type is [quantitative](#quantitative) or a [`quantize`](#quantize), the derived domain will be a two-element [min, max] array. If the scale type is [discrete](#discrete), the derived domain will be an array of all distinct values. If the scale type is [`quantile`](#quantile), all values will be used to compute quantile boundaries.

### Multi-Field Data References

Scale domains can also be derived using values from multiple fields. Multiple fields from the same data set can be specified by replacing the _field_ property with a _fields_ property that takes an array of field names:

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| data          | {% include type t="String" %}  | {% include required %} The name of the data set containing domain values.|
| fields        | {% include type t="Field[]" %} | {% include required %} The names of the data field (e.g., `["price", "cost"]`).|
| sort          | {% include type t="Boolean" %}{% include or %}[Sort](#sort) | If a boolean `true` value, sort the domain values in ascending order. If object-valued, sort the domain according to the provided [sort parameters](#sort). Sorting is only supported for [discrete scale types](#discrete).|

More generally, scale domains may also use values pulled from different data sets. In this case, the domain object should have a _fields_ property, which is an array of basic data references:

| Property      | Type            | Description    |
| :------------ | :-------------: | :------------- |
| fields        | {% include array t="[DataRef](#dataref)" %} | {% include required %} An array of basic [data references](#dataref) indicating each data set and field value to include in the domain. In addition, array literals (e.g., `[0, 100]`, `["a", "b", "c"]`) may be included as elements of the _fields_ array for inclusion in the domain determination.|
| sort          | {% include type t="Boolean" %}{% include or %}[Sort](#sort) | If a boolean `true` value, sort the domain values in ascending order. If object-valued, sort the domain according to the provided [sort parameters](#sort). Sorting is only supported for [discrete scale types](#discrete).|

Here is an example that constructs a domain using the fields `price` and `cost` drawn from two different data sets:

```json
"domain": {
  "fields": [
    {"data": "table1", "field": "price"},
    {"data": "table2", "field": "cost"}
   ]
}
```

### <a name="sort"></a>Sorting Domains

The _sort_ property of a domain [data reference](#dataref) can accept, in addition to a simple boolean, an object-valued sort definition:

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| field         | {% include type t="Field" %}   | The data field to sort by. If unspecified, defaults to the field specified in the outer data reference.|
| op            | {% include type t="String" %}  | An aggregate operation to perform on the field prior to sorting. Examples include `count`, `mean` and `median`. This property is required in cases where the _sort_ field and the data reference _field_ do not match. The input data objects will be aggregated, grouped by data reference _field_ values. For a full list of operations, see the [aggregate transform](../transforms/aggregate/#ops), and also see below for limitations with multi-field domains.|
| order         | {% include type t="String" %}  | The sort order. One of `ascending` (default) or `descending`.|

This example sorts distinct `category` field values in descending order by the associated median of the `value` field:

```json
{
  "domain": {
    "data": "table",
    "field": "category",
    "sort": {"op": "median", "field": "value", "order": "descending"}
  }
}
```

This example sorts a multi-field domain in descending order based on the counts of each of the domain values:

```json
{
  "domain": {
    "data": "table",
    "fields": ["category1", "category2"],
    "sort": {"op": "count", "order": "descending"}
  }
}
```

**Note:** For multi-field domains, the sort _field_ values may not be undefined across all input data sets, and will exhibit duplicate values when drawing multiple domain values from the same data set. To avoid inaccurate sorting, the only allowed sort _op_ values for multi-domain scales are `count`, `min`, and `max`. Support for `min` and `max` is available in versions {% include tag ver="5.5" %}.

## <a name="range"></a>Scale Ranges

Scale ranges can be specified in multiple ways:

- As an [array](../types/#Array) literal of range values. For example, `[0, 500]` or `['a', 'b', 'c']`. Array literals may include signal references as elements.
- A [signal reference](../types/#Signal) that resolves to a range value array. For example, `{"signal": "myRange"}`.
- A [color scheme reference](../schemes) for a color palette. For example, `{"scheme": "blueorange"}`.
- For [`ordinal`](#ordinal) scales only, a [data reference](#dataref) for a set of distinct field values. For example, `{"data": "table", "field": "value"}`.
- For [`band`](#band) and [`point`](#point) scales only, a [step size](#band) for each range band. For example, `{"step": 20}`.
- A string indicating a pre-defined [scale range default](#range-defaults). For example, `"width"`, `"symbol"`, or `"diverging"`.

### <a name="range-literals"></a>Scale Range Defaults

Scale ranges can also accept string literals that map to default values. Default values can be modified, and new named defaults can be added, by using custom [config settings](../config).

| Value         | Description    |
| :------------ | :------------- |
| `"width"`     | A spatial range determined by the value of the `width` signal. |
| `"height"`    | A spatial range determined by the value of the `height` signal. The direction of the range (top-to-bottom or bottom-to-top) is automatically determined according to the scale type.|
| `"symbol"`    | The default plotting symbol set to use for shape encodings.|
| `"category"`  | The default [categorical color scheme](../schemes/#categorical) to use for nominal data.|
| `"diverging"` | The default [diverging color scheme](../schemes/#diverging) to use for quantitative data.|
| `"ordinal"`   | The default [sequential color scheme](../schemes/#seq-single-hue) to use for ordinal data.|
| `"ramp"`      | The default [sequential color scheme](../schemes/#seq-single-hue) to use for quantitative data.|
| `"heatmap"`   | The default [sequential color scheme](../schemes/#seq-multi-hue) to use for quantitative heatmaps.|

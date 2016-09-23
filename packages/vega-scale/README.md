# vega-scale

Scales and color schemes for visual encoding.

This module provides [scale](#scale) and [scheme](#scheme) methods for
managing scale mappings and color schemes. By default, the scale and
scheme registries include all scale types and color schemes provided
by the D3 4.0 [d3-scale](https://github.com/d3/d3-scale) and
[d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic) modules.
In addition, this module provides a new `'index'` scale type for
supporting mappings from a sorted ordinal domain to a continuous range.
Internally, an index scale maps an ordinal domain to a range of
consecutive integer values, which in turn can map to a continuous
output range such as a color ramp or sequential color scheme.

## API Reference

<a name="scale" href="#scale">#</a>
vega.<b>scale</b>(<i>type</i>[, <i>scale</i>])
[<>](https://github.com/vega/vega-scale/blob/master/src/scales.js "Source")

Registry function for adding and accessing scale constructor functions.
The *type* argument is a String indicating the name of the scale type.
If the *scale* argument is not specified, this method returns the matching
scale constructor in the registry, or `null` if not found.
If the *scale* argument is provided, it must be a scale constructor function
to add to the registry under the given *type* name.

By default, the scale registry includes entries for all scale types provided
by D3 4.0's [d3-scale](https://github.com/d3/d3-scale) module. Scales created
using the constructor returned by this method have an additional `type`
property indicating the scale type. All scales supporting either an `invert`
or `invertExtent` method are augmented with an additional `invertRange`
function that returns an array of corresponding domain values for a given
interval in the scale's output range.

Scale constructors returned by this method accept two optional parameters:
a *scheme* string, indicating a valid [scheme](#scheme) name applicable to
either `'ordinal'` or `'sequential'` scales; and a *reverse* boolean,
indicating if a sequential color scheme should be reversed.

```js
// linear scale
var linear = vega.scale('linear');
var scale = linear().domain([0, 10]).range([0, 100]);
scale.type; // 'linear'
scale.invertRange([0, 100]); // [0, 10]
```

```js
var ordinal = vega.scale('ordinal');

// ordinal scale
var scale1 = ordinal().domain(['a', 'b', 'c']).range([0, 1, 2]);
scale1.type; // 'ordinal'

// ordinal scale with range set to the 'category20' color palette
var scale2 = ordinal(vega.scheme('category20'));
```

```js
var seq = vega.scale('sequential');

// sequential scale, using the plasma color palette
var scale1 = seq(vega.scheme('plasma'));
scale1.type; // 'sequential'

// sequential scale, using a reversed viridis color palette
var scale2 = seq(vega.scheme('viridis'), true);
```

<a name="scheme" href="#scheme">#</a>
vega.<b>scheme</b>(<i>name</i>[, <i>scheme</i>])
[<>](https://github.com/vega/vega-scale/blob/master/src/schemes.js "Source")

Registry function for adding and accessing color schemes.
The *name* argument is a String indicating the name of the color scheme.
If the *scheme* argument is not specified, this method returns the matching
scheme value in the registry, or `null` if not found.
If the *scheme* argument is provided, it must be a valid color array or
[interpolator](https://github.com/d3/d3-scale#sequential_interpolator)
to add to the registry under the given *name*.

By default, the scheme registry includes entries for all scheme types
provided by D3 4.0's [d3-scale](https://github.com/d3/d3-scale) and
[d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic) module.
Valid schemes are either arrays of color values (applicable to
`'ordinal'` scales) or
[interpolator](https://github.com/d3/d3-scale#sequential_interpolator)
functions (applicable to `'sequential'` scales.)

---
layout: api
title: Extensibility API
permalink: /docs/api/extensibility/index.html
---

Vega can be **extended** at runtime with new [scales](../../scales), [projections](../../projections), [color schemes](../../schemes), and [data transforms](../../transforms). While sometimes useful for custom deployments, keep in mind that extending Vega with new components can result in Vega JSON specifications that others may not be able to use directly.

## Extensibility API Reference

- [Projections](#projections)
- [Scales](#scales)
- [Schemes](#schemes)
- [Transforms](#transforms)


## <a name="projections"></a>Projections

<a name="projection" href="#projection">#</a>
vega.<b>projection</b>(<i>type</i>[, <i>projection</i>])
[<>](https://github.com/vega/vega-geo/blob/master/src/projections.js "Source")

Registry function for adding and accessing cartographic projections. The *type* argument is a String indicating the name of the projection type. If the *projection* argument is not specified, this method returns the matching projection constructor in the registry, or `null` if not found. If the *projection* argument is provided, it must be a projection constructor function to add to the registry under the given *type* name.

By default, Vega includes all cartographic projections provided by the [d3-geo](https://github.com/d3/d3-geo#) library. Projections created using the constructor returned by this method have an additional `copy` method that generates a new clone of a projection. Vega can be extended with additional projections, such as those found in the [d3-geo-projection](https://github.com/d3/d3-geo-projection) library. For example:

```js
// d3-geo-projections must be imported and added to d3 object
// to register with Vega, provide a name and d3 projection function
vega.projection('winkel3', d3.geoWinkel3);

// Vega parser and runtime now support the 'winkel3' projection
var runtime = vega.parse({
  ...,
  "projections": [
    { "name": "proj", "type": "winkel3" }
  ],
  ...
});
```


## <a name="scales"></a>Scales

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
var scale2 = ordinal().range(vega.scheme('category20'));
```

```js
var seq = vega.scale('sequential');

// sequential scale, using the plasma color palette
var scale1 = seq().interpolator(vega.scheme('plasma'));
scale1.type; // 'sequential'
```


## <a name="schemes"></a>Color Schemes

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
Valid schemes are either arrays of color values (e.g., applicable to
`'ordinal'` scales) or
[interpolator](https://github.com/d3/d3-scale#sequential_interpolator)
functions (e.g., applicable to `'sequential'` scales.)


## <a name="transforms"></a>Transforms

<a name="register" href="#register">#</a>
vega.<b>register</b>(<i>definition</i>, <i>transform</i>)
[<>](https://github.com/vega/vega-dataflow/blob/master/src/register.js "Source")

Registers a new data transform for use within Vega JSON specifications.

The _definition_ argument is an object providing the name, metadata, and parameters accepted by the transform. The [vega-dataflow](https://github.com/vega/vega-dataflow) repository includes a collection of [definition object examples](https://github.com/vega/vega-dataflow/tree/master/definitions). The _transform_ argument is a constructor function for a Vega dataflow [Transform](https://github.com/vega/vega-dataflow/blob/master/src/Transform.js) instance.

Note that if a transform is registered at runtime, any Vega JSON specifications using the new transform will fail JSON schema validation, as the new transform is not included in the default schema definition. To include new transforms within a custom JSON schema, developers can create a custom Vega build, using the [register](#register) method to add the transform during the build process.

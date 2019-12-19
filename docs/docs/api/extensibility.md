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
- [Transforms](#transform)
- [Data Formats](#format)
- [Expression Functions](#expressions)


## <a name="projections"></a>Projections

<a name="projection" href="#projection">#</a>
vega.<b>projection</b>(<i>type</i>[, <i>projection</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-geo/src/projections.js "Source")

Registry function for adding and accessing cartographic projections. The *type* argument is a String indicating the name of the projection type. If the *projection* argument is not specified, this method returns the matching projection constructor in the registry, or `null` if not found. If the *projection* argument is provided, it must be a projection constructor function to add to the registry under the given *type* name.

By default, Vega includes all cartographic projections described in the [Vega Projections documentation](../../projections/). Projections created using the constructor returned by this method have an additional `copy` method that generates a new clone of a projection. Vega can be extended with additional projections, such as those found in the [d3-geo-projection](https://github.com/d3/d3-geo-projection) library. For example:

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
vega.<b>scale</b>(<i>type</i>[, <i>scale</i>, <i>metadata</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-scale/src/scales.js "Source")

Registry function for adding and accessing scale constructor functions. The *type* argument is a String indicating the name of the scale type. If the *scale* argument is not specified, this method returns the matching scale constructor in the registry, or `null` if not found. If the *scale* argument is provided, it must be a scale constructor function to add to the registry under the given *type* name.

The *metadata* argument provides additional information to guide appropriate use of scales within Vega. The *metadata* can be either a string or string array. The valid string values are:

* `"continuous"` - the scale is defined over a continuous-valued domain.
* `"discrete"` - the scale is defined over a discrete domain and range.
* `"discretizing"` - the scale discretizes a continuous domain to a discrete range.
* `"interpolating"` - the scale range is defined using a color interpolator.
* `"log"` - the scale performs a logarithmic transform of the continuous domain.
* `"temporal"` - the scale domain is defined over date-time values.

By default, the scale registry includes entries for all scale types provided by the [d3-scale](https://github.com/d3/d3-scale) module. Scales created using the constructor returned by this method have an additional `type` property indicating the scale type. All scales supporting either an `invert` or `invertExtent` method are augmented with an additional `invertRange` function that returns an array of corresponding domain values for a given interval in the scale's output range.

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
[<>](https://github.com/vega/vega/blob/master/packages/vega-scale/src/schemes.js "Source")

Registry function for adding and accessing color schemes.  The *name* argument is a String indicating the name of the color scheme. Scheme names are *not* case sensitive, for example `"blues"` and `"Blues"` map to the same scheme. If the *scheme* argument is not specified, this method returns the matching scheme value in the registry, or `undefined` if not found. If the *scheme* argument is provided, it must be a valid array of color values or an interpolator function that maps the domain [0, 1] to color values.

By default, the scheme registry includes entries for all scheme types described in the [Vega Color Schemes documentation](../../schemes/).

## <a name="transform"></a>Transforms

<a name="transforms" href="#transforms">#</a>
vega.<b>transforms</b>
[<>](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/register.js "Source")

An object that maps transform names to transform constructors. To add a new transform to Vega, assign the transform to this object under the desired name.

In order to parse transform references within a Vega specification, the transform constructor *must* have a `Definition` property that provides the necessary metadata and parameter information. The [vega-transforms](https://github.com/vega/vega/blob/master/packages/vega-transforms) package includes a collection of transforms demonstrating the syntax of definition objects.

Note that if a transform is added at runtime, any Vega JSON specifications using the new transform will fail JSON schema validation, as the new transform will not have been included in the default schema definition. To include new transforms within a custom JSON schema, developers can create a custom Vega build, adding new transforms to the vega-dataflow `transforms` export during the build process.


## <a name="format"></a>Data Formats

<a name="formats" href="#formats">#</a>
vega.<b>formats</b>(<i>name</i>[, <i>format</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-loader/src/formats/index.js "Source")

Registry function for data format parsers. If invoked with two arguments, adds a new *format* parser with the provided *name*. Otherwise, returns an existing parser with the given *name*. The method signature of a format parser is:

- <b>format</b>(<i>data</i>, <i>options</i>)

A format parser that accepts two arguments, the input *data* to parse (e.g., a block of CSV text) and a set of format-specific *options*. The following data formats are registered by default:

- *dsv*: Delimiter-separated values format. Each line of text is a record,
with each field separated by a delimiter string. Accepts a *delimiter* option indicating the delimiter string used to separate field values.
- *csv*: Comma-separated values format. A *dsv* instance with a comma (`,`) delimiter.
- *tsv*: Tab-separated values format. A *dsv* instance with a tab (`\t`) delimiter.
- *json*: [JavaScript Object Notation (JSON)](https://en.wikipedia.org/wiki/JSON) format. Accepts a *property* option, indicating a sub-property of the parsed JSON to return; useful if a data array is nested within a larger object. Also accepts a *copy* option (default `false`), which will defensively copy a JSON Object that was passed to Vega directly, rather than parsed from a string.
- *topojson*: [TopoJSON](https://github.com/topojson/topojson/) format for compressed encoding of geographic data. Requires either a *feature* option indicating the name of the geographic feature to extract (e.g., extracts individual paths for all countries), or a *mesh* option indicating a feature name for which a single mesh should be extracted (e.g., all country boundaries in a single path). Please see the [TopoJSON documentation](https://github.com/topojosn/topojson/wiki) for more.


## <a name="expressions"></a>Expression Functions

<a name="expressionFunction" href="#expressionFunction">#</a>
vega.<b>expressionFunction</b>(<i>name</i>[, <i>fn</i>, <i>visitor</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-parser/src/parsers/expression/codegen.js "Source")

Registry function for adding and accessing expression functions. The *name* argument is a String indicating the name of the function, as used within the [Vega expression language](../../expressions). If the *fn* argument is not specified, this method returns the matching function value in the registry, or `undefined` if not found. If the *fn* argument is provided, it must be a valid JavaScript [`function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) to add to the registry under the given *name*. Once added, the parser will accept Vega specifications with expressions invoking this named function.

The *visitor* argument is an expression AST (abstract syntax tree) visitor function which can be used to perform dependency analysis (e.g., for scale or data source lookups), and is used internally by Vega. For most basic functions no visitor is needed, in which case this argument can be omitted.

Note that new expressions must be added _before_ parsing a spec that uses the custom function. After registering a new expression function, all subsequently parsed Vega specifications will have access to the function.

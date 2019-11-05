---
layout: spec
title: Parameter Types
permalink: /docs/types/index.html
---

Reference documentation for common parameter **types** expected by Vega specification properties.

## <a name="reference"></a>Parameter Type Reference

- [Any](#Any)
- [Array](#Array)
- [Boolean](#Boolean)
- [Color](#Color)
- [Date](#Date)
- [Gradient](#Gradient)
- [Number](#Number)
- [Object](#Object)
- [String](#String)
- [URL](#URL)
- [Data](#Data)
- [Field](#Field)
- [Signal](#Signal)
- [Compare](#Compare)
- [Expr](#Expr)
- [Value](#Value)
- [ColorValue](#ColorValue)
- [FieldValue](#FieldValue)
- [GradientValue](#GradientValue)
- [TimeMultiFormat](#TimeMultiFormat)
{: .column-list }

## Literal Values

<a name="*"></a><a name="Any" href="#Any">#</a>
**Any** or **\***

Accepts any literal value, including a string, number, boolean, or `null`.

<br/><a name="Array" href="#Array">#</a>
**Array** or **{% include array t="Type" %}**

Accepts array values. For example: `[]`, `[1, 2, 3]`, `["foo", "bar"]`. If individual array items must adhere to a specific type, bracket notation &ndash; such as {% include array t="Number" %} or {% include array t="String" %} &ndash; is used to indicate the item type.

In most cases, arrays may also have [signal references](#Signal) as items. For example: `[{"signal": "width"}, {"signal": "height"}]`.

<br/><a name="Boolean" href="#Boolean">#</a>
**Boolean**

Accepts boolean values. For example: `true`, `false`.

<br/><a name="Color" href="#Color">#</a>
**Color**

Accepts a valid CSS color string. For example: `#f304d3`, `#ccc`, `rgb(253, 12, 134)`, `steelblue`.

<br/><a name="Date" href="#Date">#</a>
**Date**

A valid JavaScript `Date` object or timestamp. As JSON does not support date values natively, within a Vega specification a date-time value can be expressed either as a numeric timestamp (the number of milliseconds since the UNIX epoch, as produced by the [Date.getTime()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime) method) or using a signal expression (such as `{"signal": "datetime(2001, 2, 3)"}`).

<br/><a name="Gradient" href="#Gradient">#</a>
**Gradient** {% include tag ver="5.4" %}

Accepts an object that specifies a gradient color pattern. To define a linear gradient based on a color scale, use a [GradientValue](#GradientValue) instead.

For example:

```json
{
  "gradient": "linear",
  "stops": [
    {"offset": 0.0, "color": "red"},
    {"offset": 0.5, "color": "white"},
    {"offset": 1.0, "color": "blue"}
  ]
}
```

<a name="LinearGradient" href="#LinearGradient">#</a>
**Linear Gradient**

A linear gradient interpolates colors along a line, from a starting point to an ending point. By default a linear gradient runs horizontally, from left to right. Use the _x1_, _y1_, _x2_, and _y2_ properties to configure the gradient direction. All coordinates are defined in a normalized [0, 1] coordinate space, relative to the bounding box of the item being colored.

| Name          | Type                          | Description  |
| :------------ | :---------------------------: | :------------|
| gradient      | {% include type t="String" %} | {% include required %} The type of gradient. Use `"linear"` for a linear gradient.|
| x1            | {% include type t="Number" %} | The starting x-coordinate, in normalized [0, 1] coordinates, of the linear gradient (default 0).|
| y1            | {% include type t="Number" %} | The starting y-coordinate, in normalized [0, 1] coordinates, of the linear gradient (default 0).|
| x2            | {% include type t="Number" %} | The ending x-coordinate, in normalized [0, 1] coordinates, of the linear gradient (default 1).|
| y2            | {% include type t="Number" %} | The ending y-coordinate, in normalized [0, 1] coordinates, of the linear gradient (default 0).|
| stops         | {% include array t="[GradientStop](#GradientStop)" %} | {% include required %} An array of gradient stops defining the gradient color sequence.|

<a name="RadialGradient" href="#RadialGradient">#</a>
**Radial Gradient**

A radial gradient interpolates colors between two circles, from an inner circle boundary to an outer circle boundary. By default a radial gradient runs from the center point of the coordinate system (zero radius inner circle), out to the maximum extent (0.5 radius outer circle). Use the _x1_, _y1_, _x2_, and _y2_ properties to configure the inner and outer circle center points, and use the _r1_ and _r2_ properties to configure the circle radii. All coordinates are defined in a normalized [0, 1] coordinate space, relative to the bounding box of the item being colored. A value of 1 corresponds to the maximum extent of the bounding box (width or height, whichever is larger).

| Name          | Type                          | Description  |
| :------------ | :---------------------------: | :------------|
| gradient      | {% include type t="String" %} | {% include required %} The type of gradient. Use `"radial"` for a radial gradient.|
| x1            | {% include type t="Number" %} | The x-coordinate, in normalized [0, 1] coordinates, for the center of the inner circle for the gradient (default 0.5).|
| y1            | {% include type t="Number" %} | The y-coordinate, in normalized [0, 1] coordinates, for the center of the inner circle for the gradient (default 0.5).|
| r1            | {% include type t="Number" %} | The radius length, in normalized [0, 1] coordinates, of the inner circle for the gradient (default 0).|
| x2            | {% include type t="Number" %} | The x-coordinate, in normalized [0, 1] coordinates, for the center of the outer circle for the gradient (default 0.5).|
| y2            | {% include type t="Number" %} | The y-coordinate, in normalized [0, 1] coordinates, for the center of the outer circle for the gradient (default 0.5).|
| r2            | {% include type t="Number" %} | The radius length, in normalized [0, 1] coordinates, of the outer circle for the gradient (default 0.5).|
| stops         | {% include array t="[GradientStop](#GradientStop)" %} | {% include required %} An array of gradient stops defining the gradient color sequence.|

<a name="GradientStop" href="#GradientStop">#</a>
**Gradient Stop**

A gradient stop consists of a [Color](#Color) value and an _offset_ progress fraction.

| Name          | Type                          | Description  |
| :------------ | :---------------------------: | :------------|
| offset        | {% include type t="Number" %} | {% include required %} The offset fraction for the color stop, indicating its position within the gradient.|
| color         | [Color](#Color)               | {% include required %} The color value at this point in the gradient.|

<br/><a name="Number" href="#Number">#</a>
**Number**

Accepts number values. For example: `1`, `3.14`, `1e5`.

<br/><a name="Object" href="#Object">#</a>
**Object**

Accepts object literals. For example: `{"left":5, "right":30, "top":5, "bottom":50}`. The valid object property names and types will vary across parameters; read the individual parameter descriptions for more information.


<br/><a name="String" href="#String">#</a>
**String**

Accepts string values. For example: `"bold"`, `"step-before"`, `""`.


<br/><a name="URL" href="#URL">#</a>
**URL**

Accepts a valid URL string linking to external site or resource. For example: `"data/stocks.csv"`, `"images/logo.png"`, `"https://vega.github.io/"`.

[Back to top](#reference)


## Data and Signal Types

<a name="Data" href="#Data">#</a>
**Data**

Accepts a string indicating the name of a data set. For example: `"table"`, `"nodes"`.

[Back to top](#reference)

<a name="Field" href="#Field">#</a>
**Field**

Accepts a string indicating the name of a data field. For example: `"amount"`, `"source.x"`, `"target['x']"`.

Alternatively, accepts an object with a string-valued `field` parameter. For example: `{"field": "amount"}`, `{"field": "source.x"}`. In addition, the `as` parameter can be used to specify a different output name for a field. For example: `{"field": "inputName", "as": "outputName"}`.

Valid JavaScript object access paths using either dot (`.`) or bracket (`foo['bar']`) notation will be converted into lookups on nested objects. To specify field names that contain dots but are _not_ nested lookups, escape the dot inline (`"my\\.field"`) or enclose the field name in brackets (`"[my.field]"`).

[Back to top](#reference)

<br/><a name="Signal" href="#Signal">#</a>
**Signal**

Accepts an object with a reference to a signal value or expression. The `signal` property of the object must be either a valid [signal](../signals) name string or an [expression](../expressions) string indicating a derived value. For example: `{"signal": "width"}`, `{"signal": "width / 2"}`.

[Back to top](#reference)

<br/><a name="Compare" href="#Compare">#</a>
**Compare**

Accepts an object providing a comparator definition for sorting. Comparator objects may have two properties &ndash; `field` and `order` &ndash; indicating the data fields to sort by and the desired sort order for each field. Each property can take either a single string value (to sort by one field) or an array of string values (to sort by multiple fields).

The `order` property is _optional_. If defined, order values must be one of `"ascending"` (lowest-to-highest) or `"descending"` (highest-to-lowest). If `order` is not defined, or for cases where there are fewer `order` entries than `field` entries, ascending order is used by default.

A single field comparator:

```json
{"field": "amount", "order": "ascending"}
```

A multi-field comparator:

```json
{
  "field": ["amount", "date"],
  "order": ["descending", "ascending"]
}
```

Comparators can not be specified using a single signal instance. However, the individual field and order properties can use signals:

```json
{
  "field": {"signal": "sortField"},
  "order": {"signal": "sortOrder"}
}
```

If a sort field is `null`, that field and any corresponding order entries will be ignored, just as if the entry did not exist.

[Back to top](#reference)

<br/><a name="Expr" href="#Expr">#</a>
**Expr**

Accepts an object defining an expression to apply to each data object. Some transforms (for example the [wordcloud transform](../transforms/wordcloud)) have parameters that can take a static string or number value _or_ perform a lookup operation for each datum.

There are two valid forms of expression-typed values: _field_ references and _expr_ references.

A _field_ reference results in a field lookup, identical to [field-typed parameters](#Field):

{: .suppress-error}
```json
{
  "type": "wordcloud",
  ...
  "rotate": {"field": "angle"} // per-datum lookup of the "angle" field
}
```

An _expr_ reference provides an [expression](../expressions) string that should be evaluated once per datum:

{: .suppress-error}
```json
{
  "type": "wordcloud",
  ...
  "rotate": {"expr": "datum.minAngle + round(90*random() - 45)"} // evaluate once per-datum
}
```

Unlike [signal references](#Signal) that are evaluated once per parameter, _expr_ references behave like [anonymous (or lambda) functions](https://en.wikipedia.org/wiki/Anonymous_function) that are evaluated independently per data object.  Note that both signal and _expr_ references will re-run if an upstream dependency changes.

Both _field_ and _expr_ references may include an `as` property that indicates the output field name to use.

[Back to top](#reference)

<br/><a name="Value" href="#Value">#</a>
**Value**

Accepts an object defining a _value reference_, typically used for visual encoding. A value reference consists of a base value, plus optional scale transformation and modification.

**Base Value**

The base value must be specified using one of the following properties:

| Name          | Type                          | Description  |
| :------------ | :---------------------------: | :------------|
| signal        | {% include type t="String" %} | A [signal](#Signal) name or expression.|
| color         | {% include type t="ColorValue" %} | Specifies a color using value references for each color channel. See the [color value](#ColorValue) documentation.|
| field         | {% include type t="FieldValue" %} | A data field name or descriptor. See the [field value](#FieldValue) documentation.|
| value         | {% include type t="Any" %} | A constant value. Legal values include numbers, booleans, strings, [colors](#Color), and [gradients](#Gradient).|

These properties are listed here in precedence order. For example, if _signal_ is defined, any _color_, _field_ or _value_ properties will be ignored. In addition, the base value may be left undefined in the case of certain _scale_ values, or to indicate a `null` value.

**Scale Transforms**

Once a base value is established, a scale lookup may be performed. The available scale-related properties are:

| Name          | Type          | Description  |
| :------------ |:-------------:| :------------|
| scale         | {% include type t="String|FieldValue" %} | The name of a scale transform to apply. If this parameter is an object, it indicates a [field value](#FieldValue) from which to dynamically lookup the scale name. For example `{"datum": "s"}` will use the value of field `s` on the current data object as the scale name, whereas `{"parent": "t"}` will use the value of field `t` on the parent group's data object as the scale name.|
| band          | {% include type t="Number" %} | If specified, returns the band width of the scale, multiplied by the given number. This parameter applies only to [band scales](../scales/band). For example, `{"band": 1}` indicates the full band width, while `{"band": 0.5}` indicates half the band width. If the base value is defined, the multiplied band width is added to the output of the scale transform. For example, `{"field": "a", "scale": "s", "band": 0.5}` translates to `scale(datum.a) + 0.5 * scale.bandwidth()`.|

**Value Modifiers**

After any scale transformations are applied, the resulting value can be further modified using the following properties. The basic formula of a value reference is: `pow(scale(baseValue), exponent) * mult + offset`. Value modifiers are intended for use only with numeric values.

| Name          | Type           | Description  |
| :------------ | :------------: | :------------|
| exponent      | {% include type t="Number|Value" %} | Raise the value to a given exponent, equivalent to `pow(value, exponent)`. If specified, exponentiation is applied immediately after any scale transformation.|
| mult          | {% include type t="Number|Value" %} | A multiplier for the value, equivalent to `mult * value`. Multipliers are applied after any scale transformation or exponentiation.|
| offset        | {% include type t="Number|Value" %} | An additive offset for the final value, equivalent to `value + offset`. Offsets are added after any scale transformation, exponentiation or multipliers.|
| round         | {% include type t="Boolean" %} | Indicates if the final value should be rounded (default `false`). Rounding is performed after all other modifiers. If true, equivalent to `round(value)`.|

<b>Examples</b>

* `{"value": 5}` - The constant value `5`.
* `{"field": "price"}` - The value of `price`, for the current datum.
* `{"field": "index", "mult": 20}` - The value of `index` for the current datum, multiplied by 20.
* `{"scale": "x", "value": 0}` - The result of running the value `0` through the scale named `x`.
* `{"scale": "y", "field": "price"}` - The result of running `price` for the current datum through the scale named `y`.
* `{"scale": "x", "band": 1}` - The range band width of the band scale `x`. Note that the scale must be of type "band"!
* `{"scale": "x", "band": 1, "offset": -1}` - The range band width of the band scale `x`, reduced (negative offset) by one pixel.

[Back to top](#reference)

<br/><a name="ColorValue" href="#ColorValue">#</a>
**ColorValue**

Accepts an object that defines a custom color using value references for each color channel in a chosen color space. The color space is automatically inferred from the channel names used.

Typically color values are specified as a single value indicating an RGB color. However, sometimes a designer may wish to target specific color fields or use a different color space. In the following example, we can set the red and blue channels of an RGB color as constants, and determine the green channel from a scale transform.

{: .suppress-error}
```json
{
  "fill": {
    "color": {
      "r": {"value": 255},
      "g": {"scale": "green", "field": "g"},
      "b": {"value": 0}
    }
  }
}
```

Vega supports the following color spaces:

| Name          | Description  |
| :------------ | :------------|
| [RGB](http://en.wikipedia.org/wiki/RGB_color_space)| Red, green, and blue channels defined with properties `"r"`, `"g"`, and `"b"`.|
| [HSL](http://en.wikipedia.org/wiki/HSL_and_HSV)| Hue, saturation, and lightness channels defined with properties `"h"`, `"s"`, and `"l"`.|
| [LAB](http://en.wikipedia.org/wiki/Lab_color_space)| Luminance, A (green-red contrast), and B (blue-yellow contrast) channels defined with properties `"l"`, `"a"`, and `"b"`. LAB is a perceptual color space with distances based on human color judgments.|
| [HCL](https://en.wikipedia.org/wiki/Lab_color_space#Cylindrical_representation:_CIELCh_or_CIEHLC)| Hue, chroma, and luminance channels defined with properties `"h"`, `"c"`, and `"l"`. HCL color space is a simple transform of LAB that uses polar coordinates for the AB plane.|

[Back to top](#reference)

<br/><a name="FieldValue" href="#FieldValue">#</a>
**FieldValue**

Accepts a string or an object indicating a data field value. If string-valued, the given data field name is used. If object-valued, the following properties may be used:

| Property      | Type            | Description    |
| :------------ | :-------------: | :------------- |
| signal        | {% include type t="String" %} | Evaluate the [signal](#Signal) name or expression, and use the result as the field name to lookup.|
| datum         | {% include type t="FieldValue" %} | Perform a lookup on the current data object using the given field name. This is similar to simply providing a string value. |
| group         | {% include type t="FieldValue" %} | Use a property of the enclosing group mark instance as the value (e.g., `"field": {"group": "width"}` or `"field": {"group": "height"}`).|
| parent        | {% include type t="FieldValue" %} | Use a field of the enclosing group mark's data object as the value (e.g., `"field": {"parent": "fieldInParentData"}`.|

These properties can be arbitrarily nested in order to perform _indirect_ field lookups. For example, `{"parent": {"datum": "f"}}` will first retrieve the value of the `f` field on the current mark's data object. This value will then be used as the property name to lookup on the enclosing parent group mark's data object.

In addition, `group` and `parent` references may include an optional `level` property to access grandparents and other ancestors. For example, `{"parent": "f", "level": 2}` will use the value of the `f` field of the grandparent's datum. By default, `level = 1`, indicating the immediate parent scope.

[Back to top](#reference)

<br/><a name="GradientValue" href="#GradientValue">#</a>
**GradientValue**

Defines a linear gradient based on a scale range to determine colors for a `fill` or `stroke` encoding channel. To define a gradient directly, without reference to a scale, assign a [Gradient](#Gradient) definition as an encoding's _value_ property.

| Property      | Type            | Description    |
| :------------ | :-------------: | :------------- |
| gradient      | {% include type t="String|FieldValue" %} | {% include required %} The name of a scale whose range is a [continuous color scheme](../schemes).|
| start         | {% include type t="Number[]" %} | The starting coordinate for the gradient as an [x, y] array within a normalized [0, 1] coordinate system. This coordinate is relative to the bounds of the item being colored. Defaults to `[0, 0]`.|
| stop          | {% include type t="Number[]" %} | The stopping coordinate for the gradient as an [x, y] array within a normalized [0, 1] coordinate system. This coordinate is relative to the bounds of the item being colored. Defaults to `[1, 0]`, for a horizontal gradient that spans the full bounds of an item.|
| count         | {% include type t="Number" %}   | A suggested target number of sample points to take from the color scale.|

<b>Example</b>

{: .suppress-error}
```json
{
  "encode": {
    "fill": {
      "gradient": "colorScale",
      "start": [0, 1],
      "stop": [0, 0],
      "count": 10
    }
  }
}
```

[Back to top](#reference)


<br/><a name="TimeMultiFormat" href="#TimeMultiFormat">#</a>
**TimeMultiFormat**

An object defining custom multi-format specifications for date-time values. This object must be a legal input to the [timeFormat API method](../api/time/#timeFormat):

- Object keys must be valid [time units](../api/time/#time-units) (e.g., `year`, `month`, etc).
- Object values must be valid [d3-time-format](https://github.com/d3/d3-time-format/#locale_format) specifier strings.

These values, in conjunction with defaults for unspecified units, will then be used to create a dynamic formatting function that uses different formats depending on the granularity of the input date (e.g., if the date lies on a year, month, date, hour, _etc._ boundary). For more information, see the [timeFormat API documentation](../api/time/#timeFormat).

[Back to top](#reference)

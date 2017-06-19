---
layout: mark
title: Marks
permalink: /docs/marks/index.html
---

Graphical **marks** visually encode data using geometric primitives such as rectangles, lines, and plotting symbols. Marks are the basic visual building block of a visualization, providing basic shapes whose properties can be set according to backing data. Mark property definitions may be simple constants or data fields, or [scales](../scales) can be used to map data values to visual values.

## <a name="types"></a>Supported Mark Types

The supported mark types are:

- [`arc`](arc) - Circular arcs, including pie and donut slices.
- [`area`](area) - Filled areas with horizontal or vertical alignment.
- [`image`](image) - Images, including icons or photographs.
- [`group`](group) - Containers for other marks, useful for sub-plots.
- [`line`](line) - Stroked lines, often used for showing change over time.
- [`path`](path) - Arbitrary paths or polygons, defined using SVG path syntax.
- [`rect`](rect) - Rectangles, as in bar charts and timelines.
- [`rule`](rule) - Rules are line segments, often used for axis ticks and grid lines.
- [`shape`](shape) - A special variant of path marks for faster drawing of cartographic maps.
- [`symbol`](symbol) - Plotting symbols, including circles, squares and other shapes.
- [`text`](text) - Text labels with configurable fonts, alignment and angle.
- [`trail`](trail) - Lines that can change size based on underlying data.

## Visual Encoding

Each mark supports a set of visual encoding properties that determine the position and appearance of mark instances. Typically one mark instance is generated per input data element; the exceptions are the `line` and `area` mark types, which represent multiple data elements as a single line or area shape.

A mark definition typically looks something like this:

```json
{
  "type": "rect",
  "from": {"data": "table"},
  "encode": {
    "enter": {
      "y": {"scale": "yscale", "field": "value"},
      "y2": {"scale": "yscale", "value": 0},
      "fill": {"value": "steelblue"}
    },
    "update": {...},
    "exit": {...},
    "hover": {...}
  }
}
```

There are three primary property sets: _enter_, _update_, _exit_. The _enter_ properties are evaluated when data is processed for the first time and a mark instance is newly added to a scene. The _update_ properties are evaluated for all existing (non-exiting) mark instances. The _exit_ properties are evaluated when the data backing a mark is removed, and so the mark is leaving the visual scene. To better understand how enter, update, and exit sets work, take a look at [Mike Bostock's Thinking with Joins](http://bost.ocks.org/mike/join/).

In addition, an optional _hover_ set determines visual properties when the mouse cursor hovers over a mark instance. Upon mouse out, the _update_ set is applied.

There is also a special group mark type (`group`) that can contain other marks, as well as local data, signal, scale, axis and legend definitions. Groups can be used to create visualizations consisting of grouped or repeated elements; examples include stacked graphs (each stack is a separate group containing a series of data values) and small multiples displays (each plot is contained in its own group). See the [Group Marks](../marks/group) page for more.

## Top-Level Mark Properties

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| type          | {% include type t="String" %}  | {% include required %} The graphical mark type. Must be one of the [supported mark types](#types).|
| clip          | {% include type t="Boolean" %} | Indicates if the marks should be clipped to the enclosing group's width and height (default `false`).|
| description   | {% include type t="String" %}  | An optional description of this mark. Can be used as a comment.|
| encode        | [Encode](#encode)              | An object containing a set of visual encoding rules for mark properties.|
| from          | [From](#from)                  | An object describing the data this mark set should visualize. If undefined, a single element data set containing an empty object is assumed. The _from_ property can either specify a data set to use (e.g., `{"data": "table"}`) or provide a faceting directive to subdivide a data set across a set of [`group` marks](../marks/group).|
| interactive   | {% include type t="Boolean" %} | A boolean flag (default `true`) indicating if the marks can serve as input event sources. If `false`, no mouse or touch events corresponding to the marks will be generated.|
| key           | {% include type t="Field" %}   | A data field to use as a unique key for data binding. When a visualization's data is updated, the key value will be used to match data elements to existing mark instances. Use a key field to enable object constancy for transitions over dynamic data.|
| name          | {% include type t="String" %}  | A unique name for the mark. This name can be used to refer to these marks within an [event stream definition](../event-streams). SVG renderers will add this name value as a CSS class name on the enclosing SVG group (`g`) element containing the mark instances.|
| on            | {% include array t="[Trigger](../triggers)" %} | A set of triggers for modifying mark properties in response to signal changes. |
| sort          | {% include type t="Compare" %} | A comparator for sorting mark items. The sort order will determine the default rendering order. The comparator is defined over generated scenegraph items and sorting is performed after encodings are computed, allowing items to be sorted by size or position. To sort by underlying data properties in addition to mark item properties, use field names such as `"datum.field"`.|
| transform     | {% include array t="[Transform](../transforms)" %} | A set of post-encoding transforms, applied after any _encode_ blocks, that operate directly on mark scenegraph items (not backing data objects). These can be useful for performing layout with transforms that can set `x`, `y`, `width`, `height`, _etc._ properties. Only data transforms that do not generate or filter data objects may be used.|
| role          | {% include type t="String" %}  | A metadata string indicating the role of the mark. SVG renderers will add this role value (prepended with the prefix `role-`) as a CSS class name on the enclosing SVG group (`g`) element containing the mark instances. Roles are used internally by Vega to perform custom processing and layout, do not set this property unless you know which layout effect you are trying to achieve.|

## <a name="from"></a>Mark Data Sources (`from`)

The `from` property indicates the data source for a set of marks.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| data          | {% include type t="String" %}  | The name of the data set to draw from.|
| facet         | [Facet](#facet)                | An option facet definition for partitioning data across multiple group marks. Only [`group` mark](group) definitions may use the facet directive.|

### <a name="facet"></a>Faceting

The `facet` directive splits up a data source among multiple group mark items. Each group mark is backed by an aggregate data value representing the entire group, and then instantiated with its own named data source that contains a local partition of the data. Facets can either be _data-driven_, in which partitions are determined by grouping data values according to specified attributes, or _pre-faceted_, such that a source data value already contains within it an array of sub-values.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| name          | {% include type t="String" %}  | {% include required %} The name of the generated facet data source. Marks defined with the faceted group mark can reference this data source to visualize the local data partition.|
| data          | {% include type t="String" %}  | {% include required %} The name of the source data set from which the facet partitions are generated.|
| field         | {% include type t="Field" %}  | For pre-faceted data, the name of the data field containing an array of data values to use as the local partition. This property is **required** if using pre-faceted data. |
| groupby       | {% include type t="Field|Field[]" %}  | For data-driven facets, an array of field names by which to partition the data. This property is **required** if using data-driven facets. |
| aggregate     | {% include type t="Object" %}  | For data-driven facets, an optional object containing [aggregate transform parameters](../transforms/aggregate) for the aggregate data values generated for each facet group item. The supported parameters are `fields`, `ops`, `as`, and `cross`.|

When generating data-driven facets, by default new aggregate data values are generated to serve as the data backing each group mark item. However, if _both_ the `data` and `facet` properties are defined in the `from` object, pre-existing aggregate values will be pulled from the named `data` source. In such cases it is **critical** that the aggregate and facet `groupby` domains match. If they do not match, the behavior of the resulting visualization is undefined.

## <a name="encode"></a>Mark Encoding Sets

All visual mark property definitions are specified as name-value pairs in a property set (such as `update`, `enter`, or `exit`). The name is simply the name of the visual property. The value should be a [_value reference_](#valueref) or [_production rule_](#production-rule), as defined below.

The `enter` set is invoked when a mark item is first instantiated and also when a visualization is resized. Unless otherwise indicated, the `update` set is invoked whenever data or display properties update. The `exit` set is invoked when the data value backing a mark item is removed. If hover processing is requested on the Vega View instance, the `hover` set will be invoked upon mouse hover.

Custom encoding sets with arbitrary names are also allowed. To invoke a custom encoding set (e.g., instead of the `update` set), either pass the encoding set name to the [Vega View run method](../api/view/#view_run) or define a [signal event handler with an `"encode"` directive](../signals/#handlers).

## <a name="valueref"></a>Value References

A _value reference_ specifies the value for a given mark property. The value may be a constant or drawn from a data object. In addition, the value may be run through a scale transform and further modified.

| Name          | Type                                 | Description  |
| :------------ | :----------------------------------: | :------------|
| value         | {% include type t="Any" %}           | A constant value. If _field_ is specified, this value is ignored.|
| field         | [FieldRef](#fieldref)                | A field from which to retrieve a data value. The corresponding data set is determined by the mark's _from_ property. If a string-valued field name is provided, the value is pulled from the current datum.  Dot notation (`"price.min"`) is used to access nested properties; if a dot character is actually part of the property name, you must escape the dot with a backslash: `"some\.field"`.  To pull value from the enclosing group mark's element or datum, this property can be specified as an object. |
| scale         | [FieldRef](#fieldref)                | The name of a scale transform to apply. If the input is an object, it indicates a field value from which to dynamically lookup the scale name and follows the format of the _field_ property. For example `{"datum": "s"}` will use the value of `s` on the current mark's data as the scale name, whereas `{"parent": "t"}` will use the value of `t` on the current group's data as the scale name.|
| mult          | {% include type t="Number" %}        | A multiplier for the value, equivalent to (mult * value). Multipliers are applied after any scale transformation.|
| offset        | {% include type t="Number" %}        | A simple additive offset to bias the final value, equivalent to (value + offset). Offsets are added _after_ any scale transformation and multipliers.|
| band          | {% include type t="Boolean" %}       | If true, and _scale_ is specified, uses the range band of the scale as the retrieved value. This option is useful for determining widths with a band scale (an ordinal scale where `points` is `false`).|

### <a name="fieldref"></a>Field References

A _field reference_ is either a string literal or an object. For object values, the following properties are supported:

| Property      | Type                  | Description    |
| :------------ | :-------------------: | :------------- |
| datum         | [FieldRef](#fieldref) | Perform a lookup on the current data value. This is the default operation when a _field reference_ is a string.|
| group         | [FieldRef](#fieldref) | Use a property of the enclosing group mark element. For example, `"field": {"group": "width"}` or `"field": {"group": "height"}`).|
| parent        | [FieldRef](#fieldref) | Use a property of the enclosing group mark's datum. For example, `"field": {"parent": "fieldInParentData"}`.|
| level         | {% include type t="Number" %} | A positive integer (default `1`) used in conjunction with the _group_ and _parent_ properties to access grandparents or other ancestors. For example, `"field": {"parent": "f", "level": 2}` will use the value of the `f` field of the grandparent datum.|

These properties can be arbitrarily nested in order to perform _indirect_ field lookups. For example, `"field": {"parent": {"datum": "f"}}` will first retrieve the value of the `f` field on the current mark's data object. This value will then be used as the property name to lookup on the enclosing group mark's datum.

### Examples

* `{"value": 5}` - The constant value `5`.
* `{"field": "price"}` - The value of `price` for the current datum.
* `{"field": "index", "mult": 20}` - The value of `index` for the current datum, multiplied by 20.
* `{"scale": "x", "value": 0}` - The result of running the value `0` through the scale named `x`.
* `{"scale": "y", "field": "price"}` - The result of running `price` for the current datum through the scale named `y`.
* `{"scale": "x", "band": true}` - The range band width of the ordinal scale `x`. Note that the scale must be ordinal!
* `{"scale": "x", "band": true, "offset": -1}` - The range band width of the ordinal scale `x`, reduced (negative offset) by one pixel.

### <a name="colorref"></a>Color References

Typically color values are specified as a single value indicating an RGB color. However, sometimes a designer may wish to target specific color fields or use a different color space. In this case a special Value Reference format can be used. In the following example, we can set the red and blue channels of an RGB color as constants, and determine the green channel from a scale transform.
```
"fill": {
 "r": {"value": 255},
 "g": {"scale": "green", "field": "g"},
 "b": {"value": 0}
}
```

Vega supports the following color spaces:

| Name          | Description  |
| :------------ | :------------|
| [RGB](http://en.wikipedia.org/wiki/RGB_color_space)| with properties `"r"`, `"g"`, and `"b"`.|
| [HSL](http://en.wikipedia.org/wiki/HSL_and_HSV)| (hue, saturation, lightness), with properties `"h"`, `"s"`, and `"l"`.|
| [CIE LAB](http://en.wikipedia.org/wiki/Lab_color_space)| with properties `"l"`, `"a"`, and `"b"`. A perceptual color space with distances based on human color judgments. The "L" dimension represents luminance, the "A" dimension represents green-red opposition and the "B" dimension represents blue-yellow opposition.|
| [HCL](https://en.wikipedia.org/wiki/Lab_color_space#Cylindrical_representation:_CIELCh_or_CIEHLC)            | (hue, chroma, lightness) with properties `"h"`, `"c"`, and `"l"`. This is a version of LAB which uses polar coordinates for the AB plane.|


## <a name="production-rule"></a>Production Rules

Visual properties can also be set by evaluating an `if-then-else` style chain of _production rules_. Rules consist of an array of _ValueRef_ objects, each of which must contain an additional `test` property. A single ValueRef, without a `test` property, can be specified as the final element within the rule to serve as the `else` condition. The value of this property should be a predicate [expression](https://vega.github.io/vega/docs/expressions/), that evaluates to `true` or `false`. The visual property is set to the ValueRef corresponding to the first predicate that evaluates to `true` within the rule. If none do, the property is set to the final, predicate-less, ValueRef if one is specified. For example, the following specification sets a mark's fill colour using a production rule:

```json
"fill": [
  {
    "test": "indata('selectedPoints', datum._id, 'id')",
    "scale": "c",
    "field": "species"
  },
  {"value": "grey"}
]
```

Here, if the ID of a particular data point [is found](https://vega.github.io/vega/docs/expressions/#indata) is the `selectedPoints` data source, the fill color is determined by a scale transform. Otherwise, the mark instance is filled grey.

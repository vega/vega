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

{: .suppress-error}
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
| clip          | [Clip](#clip) | Indicates if the marks should be clipped to a specified shape (default `false`). If boolean-valued, the clipping region is the enclosing group's width and height. If object-valued, should specify either an arbitrary SVG path string or a cartographic projection with which to clip to the sphere of the Earth.|
| encode        | [Encode](#encode)              | An object containing a set of visual encoding rules for mark properties.|
| from          | [From](#from)                  | An object describing the data this mark set should visualize. If undefined, a single element data set containing an empty object is assumed. The _from_ property can either specify a data set to use (e.g., `{"data": "table"}`) or provide a faceting directive to subdivide a data set across a set of [`group` marks](../marks/group).|
| interactive   | {% include type t="Boolean" %} | A boolean flag (default `true`) indicating if the marks can serve as input event sources. If `false`, no mouse or touch events corresponding to the marks will be generated. This property can also take a [Signal](../types/#Signal) value to dynamically toggle interactive status.|
| key           | {% include type t="Field" %}   | A data field to use as a unique key for data binding. When a visualization's data is updated, the key value will be used to match data elements to existing mark instances. Use a key field to enable object constancy for transitions over dynamic data.|
| name          | {% include type t="String" %}  | A unique name for the mark. This name can be used to refer to these marks within an [event stream definition](../event-streams). SVG renderers will add this name value as a CSS class name on the enclosing SVG group (`g`) element containing the mark instances.|
| on            | {% include array t="[Trigger](../triggers)" %} | A set of triggers for modifying mark properties in response to signal changes. |
| sort          | {% include type t="Compare" %} | A comparator for sorting mark items. The sort order will determine the default rendering order. The comparator is defined over generated scenegraph items and sorting is performed after encodings are computed, allowing items to be sorted by size or position. To sort by underlying data properties in addition to mark item properties, append the prefix `datum.` to a field name (e.g., `{"field": "datum.field"}`).  |
| transform     | {% include array t="[Transform](../transforms)" %} | A set of post-encoding transforms, applied after any _encode_ blocks, that operate directly on mark scenegraph items (not backing data objects). These can be useful for performing layout with transforms that can set `x`, `y`, `width`, `height`, _etc._ properties. Only data transforms that do not generate or filter data objects may be used.|
| role          | {% include type t="String" %}  | A metadata string indicating the role of the mark. SVG renderers will add this role value (prepended with the prefix `role-`) as a CSS class name on the enclosing SVG group (`g`) element containing the mark instances. Roles are used internally by Vega to guide layout. _Do not set this property unless you know which layout effect you are trying to achieve._|
| style         | {% include type t="String|String[]" %}  | A string or array of strings indicating the name of custom styles to apply to the mark. A style is a named collection of mark property defaults defined within the [configuration](../config). These properties will be applied to the mark's `enter` encoding set, with later styles overriding earlier styles. Any properties explicitly defined within the mark's `encode` block will override a style default.|
| zindex        | {% include type t="Number" %}  | The integer z-index indicating the layering of this mark set relative to other marks, axes, or legends. The default value is _0_; higher values (_1_) will cause this mark set to be drawn on top of other mark, axis, or legend definitions with lower z-index values. Note that this value applies to the all marks in a set, not individual mark _items_. To adjust the ordering of items within a set, use the _zindex_ encoding channel.|

### <a name="accessibility"></a>Accessibility Properties {% include tag ver="5.11" %}

Accessibility properties are used to determine [ARIA (Accessible Rich Internet Applications) attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) when using Vega to render SVG output. Vega will automatically generate ARIA "role" and "roleDescription" attributes for container SVG `<g>` elements for a set of mark items. The properties below can be used to disable ARIA attributes or add additional description text. In addition, individual mark items can have per-item ARIA attributes, defined within encoding channels.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| aria          | {% include type t="Boolean" %} | A boolean flag (default `true`) indicating if ARIA attributes should be included (SVG output only). If `false`, the "aria-hidden" attribute will be set on the output SVG group for the marks, removing the mark from the ARIA accessibility tree. |
| description   | {% include type t="String" %}  | A text description of this mark for ARIA accessibility (SVG output only). If the *aria* property is `true`, for SVG output the ["aria-label" attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute) will be set to this description. |

## <a name="clip"></a>Mark Clipping

The `clip` property limits the area in which a set of marks is visible. The default value (boolean `false`) disables clipping. A boolean `true` value clips the marks to the width and height of the enclosing group mark. The `clip` property also accepts a [signal](../types/#Signal) that evaluates to a boolean value.

An object specification can be used to define more sophisticated clipping regions. An object-valued `clip` must have either a `path` property (for arbitrary SVG paths) or a `sphere` property (to clip to the globe, relative to a geographic projection), but not both. Either property can be a signal value to enable dynamic clipping regions.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| path          | {% include type t="String|Signal" %}  | An [SVG path string](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) describing the clipping region. The path is assumed to lie relative to the coordinate system of the enclosing group.|
| sphere        | {% include type t="String|Signal" %}  | The name of a cartographic [projection](../projections) with which to clip all marks to the projected sphere of the globe. This option is useful in conjunction with map projections that otherwise included projected content (such as graticule lines) outside the bounds of the globe.|


## <a name="from"></a>Mark Data Sources (`from`)

The `from` property indicates the data source for a set of marks.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| data          | {% include type t="String" %}  | The name of the data set to draw from.|
| facet         | [Facet](#facet)                | An optional facet definition for partitioning data across multiple group marks. Only [`group` mark](group) definitions may use the facet directive.|

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

### <a name="reactivegeom"></a>Reactive Geometry

Typically a `"from": {"data": "..."}` statement draws data from a backing data source defined within a `"data"` block. However, Vega can also use a set of marks as the backing data objects for a new set of marks &mdash; a feature referred to as _reactive geometry_. For example, one might add text marks to serve as labels, using computed `x`, `y`, `width`, or `height` values of the source marks to determine label placement.

To use a set of marks as a backing data source, the mark definition must include a unique `name` property. The marks can then be referenced as `"from": {"data": "name"}`.

Here is an example in which point marks serve as the backing data for a set of text marks:

{: .suppress-error}
```json
{
  "marks": [
    {
      "name": "baseMarks",
      "type": "point",
      "from": {"data": "source"},
      "encode": {...}
    },
    {
      "type": "text",
      "from": {"data": "baseMarks"},
      "encode": {
        "update": {
          "x": {"field": "x", "offset": 4},
          "y": {"field": "y"},
          "text": {"field": "datum.label"}
        }
      }
    }
  ]
}
```

## <a name="encode"></a>Mark Encoding Sets

All visual mark property definitions are specified as name-value pairs in a property set (such as `update`, `enter`, or `exit`). The name is simply the name of the visual property: individual mark types support standardized encoding channel names, but arbitrary names are also allowed, resulting in new named properties on output scenegraph items. The value of a property definition should be a [_value reference_](../types/#Value) or [_production rule_](#production-rule), as defined below.

The `enter` set is invoked when a mark item is first instantiated. Unless otherwise indicated, the `update` set is invoked whenever data or display properties update. The `exit` set is invoked when the data value backing a mark item is removed. If hover processing is requested on the Vega View instance, the `hover` set will be invoked upon mouse hover.

Custom encoding sets with arbitrary names are also allowed. To invoke a custom encoding set (e.g., instead of the `update` set), either pass the encoding set name to the [Vega View run method](../api/view/#view_run) or define a [signal event handler with an `"encode"` directive](../signals/#handlers).

## <a name="valueref"></a>Value References

A _value reference_ specifies the value for a given mark property. The value may be a constant or drawn from a data object. In addition, the value may be run through a scale transform and further modified. Examples include:

- `{"value": "left"}` - Literal value
- `{"field": "amount"}` - Data field value
- `{"scale": "yscale", "field": "amount"}` - Scale-transformed data field value
- `{"signal": "sqrt(pow(datum.a, 2) + pow(datum.b, 2))"` - Signal expression value

For more, see the [Value type documentation](../types/#Value), including the specialized [Color Value](../types/#ColorValue) and [Field Value](../types/#FieldValue) types.

## <a name="production-rule"></a>Production Rules

Visual properties can also be set by evaluating an "if-then-else" style chain of _production rules_. Rules consist of an array of _value reference_ objects, each of which must contain an additional `test` property. The value of this property should be a predicate [expression](https://vega.github.io/vega/docs/expressions/), that evaluates to `true` or `false`. The visual property is set to the value reference corresponding to the first predicate that evaluates to `true` within the rule.

A single value reference, without a `test` property, can be specified as the final element within the rule to serve as the "else" condition.
If no `test` properties evaluate to `true`, the property is set to this final (predicate-less) value reference. If no "else" condition is specified, the property value defaults to `null`.

For example, the following specification sets a mark's fill colour using a production rule:

{: .suppress-error}
```json
"fill": [
  {
    "test": "indata('selectedPoints', 'key', datum.key)",
    "scale": "c",
    "field": "species"
  },
  {"value": "grey"}
]
```

Here, if the ID of a particular data point [is found](https://vega.github.io/vega/docs/expressions/#indata) is the `selectedPoints` data source, the fill color is determined by a scale transform. Otherwise, the mark instance is filled grey.

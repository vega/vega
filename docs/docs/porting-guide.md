---
layout: docs
title: Porting Guide from Vega 2
permalink: /docs/porting-guide/index.html
---

This document describes the various changes needed to port Vega 2.x visualizations to the 3.0 specification. It also introduces a subset of the new features introduced in Vega 3. While the listing below is intended to cover the most salient differences between these major versions, readers are also encouraged to dive in and study the [example gallery](../../examples).

## <a name="outline"></a>Porting Guide Outline

- [Marks and Visual Encoding](#marks)
- [Signals and Event Processing](#signals)
- [View Layout](#layout)
- [Axes and Legends](#axes-and-legends)
- [Scales](#scales)
- [Data Transforms](#transforms)
- [Geo Data](#geo)
- [Animation](#animation)
- [View API](#view)


## <a name="marks"></a>Marks and Visual Encoding

- The `"properties"` block of visual encodings has been renamed `"encode"`.

- The `"signal"` encoding directive now accepts anonymous signal expressions in addition to signal names. You can use these to directly write expressions for visual encodings. For example: `{"signal": "datum.field * 2"}`.

- The `"template"` encoding directive has been removed. Instead, use the `"signal"` directive with an expression to perform equivalent text processing.

- The `"mult"` and `"offset"` visual encoding properties now support recursive encoding directives, enabling greater control. For example, each can include a sub-encoding like so: `"x": {"scale": "xscale", "field": "foo", "offset": {"scale": "oscale", "field": "bar"}}`.

- The `"band"` property now accepts an interpolation fraction between 0 and 1 for placing elements within a scale band, and can now be used in conjunction with a field-based scale mapping. For example, the following encoding places an item at the midpoint of the appropriate scale band: `{"scale": "xscale", "field": "foo", "band": 0.5}`.

- The `rule` mark type now supports arbitrary line segments, and reliably draws a line from point `"x"`, `"y"` to point `"x2"`, `"y2"`.

- Mark definitions no longer allow embedded data transforms (e.g., `{"type": "rect", "from": {"data": "table, "transform": [...]}}`). Instead, *all* derived data sources must now be defined within a `"data"` definition block. However, as of Vega 3, `"data"` blocks are no longer constrained to only the top-level of a spec: they can be defined within `group` marks as well! For example, this flexibility allows creation of derived data sets *within* a faceted group.

- The `"facet"` transform is no longer supported. Instead, a new `"facet"` directive can be applied within a mark `"from"` block to enable multiple forms of faceting support. For example, the `barley.vg.json` example facets a group mark like so:

  {:.suppress-error}
  ```json
  "from": {
    "facet": {
      "name": "sites",
      "data": "barley",
      "groupby": "site"
    }
  },
  ```
  Child marks can visualize the faceted data by name: `"from": {"data": "sites"}`. The `"facet"` block also accepts the same parameters as an `"aggregate"` transform to apply when generating data elements for `group` mark items. In addition, Vega 3 now supports pre-faceted data, in which a data tuple may contain a nested a set of records. This oft-requested feature allows data to be grouped offline and passed directly to Vega, like so:

  {:.suppress-error}
  ```json
  "from": {
    "facet": {
      "name":  "facets",
      "data":  "input", // [{children: [...]}, {children: [...]}]
      "field": "children"
    }
  },
  ```
  In this case, each datum in `input` will back a `group` mark item, and each corresponding group will contain the data tuples referenced by the `"children"` field.

- In addition to the `"encode"` (formerly `"properties"`) blocks, mark definitions now support *post-encoding transforms*: data transforms that are run after the `"encode"` block, and which read and write scenegraph item properties directly. For example, one can run layout algorithms (force-directed layout, wordcloud layout, tree layout, *etc*.) to directly set the visual properties of items, rather than write them to an intermediate data tuple and then copy them over (as done in Vega 2). Only transforms that do not filter or generate new tuples can be used as post-encoding transforms. Here is an example excerpt from `wordcloud.vg.json`:

  {:.suppress-error}
  ```json
  "marks": [{
    "type": "text",
    "from": {"data": "table"},
    "encode": {...},
    "transform": [
      {
        "type": "wordcloud",
        "size": [800, 400],
        "text": {"field": "text"},
        ...
      }
    ]
  }]
  ```

- Vega 3 includes a new `shape` mark type. Shape marks are similar in functionality to `path` marks. However, while `path` marks require a materialized SVG path string, `shape` marks are generated procedurally by passing a path-rendering function to the renderer. This allows drawing of shapes without passing through the intermediate representation of a path string, which can considerably improve rendering time when using a canvas renderer. For SVG renderers, the shape type generates an SVG path string (but at render time, not visual encoding time) to include in the SVG DOM.

- Vega 3 adds z-index support for changing the layering order of sibling elements. Z-index values are expected to be non-negative integers. All scenegraph items default to a `zindex` of zero. Higher values indicate elements that should be drawn on top of their sibling marks. Mark, axis and legend definitions accept a `"zindex"` property, and `"zindex"` can also be used as an individual visual encoding property (e.g., in a `"hover"` or `"update"` set). Z-index sorting is performed at the sibling-level *only*; for example, it can not be used to force a single item in one mark set to be drawn on top of items in another mark set.

[Back to outline](#outline)


## <a name="signals"></a>Signals and Event Processing

- The signal `"streams"` property has been renamed `"on"`. Within an event stream definition, the `"type"` parameter has been renamed `"events"`, and the `"expr"` parameter has been renamed `"update"`. For example, the signal definition `{"name": "foo", "streams": [{"type": "rect:mousedown", "expr": "eventX()"}]}`, should now be written as `{"name": "foo", "on": [{"events": "rect:mousedown", "update": "x()"}]}`.

- The `"events"` parameter of an event stream definition can either be a string containing an event selector description (as in Vega 2.x) or can use a structured JSON schema for expressing event selections.

- The `eventItem`, `eventGroup`, `eventX`, and `eventY` expression language functions have been replaced with the more concise `item`, `group`, `x` and `y` functions. Also, a new `xy` function returns the current pointer coordinate as an `[x, y]` array.

- Events are no longer consumed (e.g., subject to `event.preventDefault()`) by default. To have Vega consume an event (and thereby suppress event propagation and default browser behavior), include an exclamation mark at the end of an event name within an event selector (e.g., `{"events": "window:mousemove!"}`).

- The `"verbose"` flag has been renamed to `"force"`, and must now be set on individual elements of the `"on"` array. For example, the signal definition `{"name": "clickedPoint", "verbose": true, "streams": [{"type": "click", "expr": "datum._id"}]}` should now be written as `{"name": "clickedPoint", "on": [{"events": "click", "update": "datum._id", "force": true}]}`.

- Instead of `"init"`, the `"value"` and `"update"` properties can be used to initialize a signal using a literal value or expression, respectively.

- Signal definitions now support a `"bind"` property that binds signal values to automatically-generated HTML input widgets. This provides an additional means of creating interactive visualizations by adding external user controls. The syntax for `"bind"` definitions follows the earlier [vega-embed](https://github.com/vega/vega-embed) model. See the `airports.vg.json` and `map-bind.vg.json` examples for more.

- The `View` API for event listeners has changed. The `view.on` and `view.off` methods are no longer defined. Either use [view.addEventListener](https://github.com/vega/vega-view#view_addEventListener) and [view.removeEventListener](https://github.com/vega/vega-view#view_removeEventListener) for standard callbacks or use the new [view.events](https://github.com/vega/vega-view#view_events) method to work with [EventStream](https://github.com/vega/vega-dataflow/blob/master/src/EventStream.js) instances instead.

- The `View` API for signal listeners has changed. Instead of `view.onSignal` and `view.offSignal`, use [view.addSignalListener](https://github.com/vega/vega-view#view_addSignalListener) and [view.removeSignalListener](https://github.com/vega/vega-view#view_removeSignalListener).

[Back to outline](#outline)


## <a name="layout"></a>View Layout

- The Vega 2.x top-level `"viewport"` property has been removed. Instead, the same behavior can be specified directly by using `width`/`height`/`overflow` CSS directives on the DOM element container for the Vega view.

- The chart `"width"` and `"height"` are automatically bound to signals with the same name. The top-level `"width"` and `"height"` properties can be omitted from the definition and instead replaced by signal definitions whose `"update"` function dynamically sets the width and/or height value.

- Vega 3 adds a new top-level `"autosize"` property to set the layout mode. The legal values are:
  - `"pad"` (default) - The width/height values determine the data rectangle for plotting. Axes and legends use additional space, with extra padding added to accommodate those elements. This is akin to `"padding": "auto"` in Vega 2.
  - `"fit"` - The width/height indicates the final size (minus any explicit padding). The actual width and height signals will be automatically resized to accommodate axes and legends within the given fit size. If elements are too large to fit in the given size, clipping may occur. This is akin to `"padding": "strict"` in Vega 2.
  - `"none`" - No automatic adjustment of size is performed. The final size is strictly the sum of the width/height and any explicit padding. Clipping may occur.

- Vega 3 removes the `"auto"` and `"strict"` options for view `"padding"`. Instead, `"padding"` now always defines a fixed padding margin around the visualization. If the `"autosize"` property is set to `"pad"`, the padding values will be added to the results of the auto-size calculation.

- SVG rendering now supports some basic responsive resizing. Generated SVG output now includes a `viewBox` attribute. This allows you to resize the SVG element and have the resulting visualization content scale accordingly.

[Back to outline](#outline)


## <a name="axes-and-legends"></a>Axes and Legends

- Axes no longer have a `type` parameter. Instead, the `orient` parameter is now required. Instead of `{"type": "x"}` use `{"orient": "bottom"}`, and instead of `{"type": "y"}` use `{"orient": "left"}`.

- The `"ticks"` parameter for suggesting the approximate number of axis ticks has been renamed `"tickCount"`.

- Custom visual properties for axes and legends now reside under an `"encode"` block and use `"enter"`, `"update"`, and `"exit"` sub-blocks. If unsure of which to use, a good default is to define an `"update"` block to ensure all properties are updated.

- In addition, the custom `"encode"` block for an axis or legend can include a boolean `"interactive"` value to control if specific axis or legend items should be subject to input events. For example, to enable interaction for legend symbols:

  {:.suppress-error}
  ```json
  "legends": [
    {
      "fill": "colorScale",
      "title": "Legend Title",
      "orient": "right",
      "encode": {
        "symbols": {
          "interactive": true,
          "hover": {...},
          "update": {...}
        }
      }
    }
  ]
  ```

- Legends now include an optional `"type"` property. By default, all legends use the `"symbol"` type, to create a discrete legend. For continuous color scales, the `"gradient"` type can be used to create a legend containing a continuous color ramp. See the `legends.vg.json` example for more.

- Axis now no longer has `"layer"` property. Instead, there is a `"zindex"` property (default `0`). By default, axes should be drawn behind all chart elements. To put them in front, use `"zindex": 1`.

- The axis line previously stylable as `"axis"` is now referred to as the axis `"domain"`. For example, use `"domain": false` to hide the axis line, or include a `"domain"` property in the `"encode"` block to style the axis line.

- Axis ticks, labels, gridlines, and domain can all be selectively enabled or disabled. Axis ticks, labels and domain are enabled by default, but can be disabled (for examepl, `"tick": false`, `"label": false`). Axis grid lines are disabled by default, but can be enabled (`"grid": true`). These toggles can be useful to achieve richer layering. For example, one might place an axis definition with only gridlines on a bottom layer, and add an axis definition with ticks and labels on a higher layer.

- By default, the axis gridline extent is determined by the settings of the signals `"width"` (for y-axis gridlines) or `"height"` (for x-axis gridlines). This is a change from Vega 2, where the group width/height was used. Vega 3 enables recursive signal definitions: named signal values can be overridden within sub-groups, allowing one to set appropriate width/height signal values in sub-plots. Alternatively, Vega 3 introduces a `"gridScale"` property which instead indicates a scale whose range should be used to determine the gridline extent. For example, if you have an x-axis scale named "xscale", the y-axis gridline lengths can be set to match that scale by using `"gridScale": "xscale"`.

[Back to outline](#outline)


## <a name="scales"></a>Scales

- Following D3 4.0's design, the `"ordinal"` scale type has now been broken up into three different scale types: `"ordinal"` (for strict lookup tables), `"band"` (for spatial ordinal scales) and `"point"` (spatial ordinal scales with no padding, similar to `{"point": true}` in Vega 2).

- Vega 3 includes D3 4.0's `"sequential"` scale type and corresponding color scales. Use the `"scheme"` property to set the range to a named color scale (e.g., `"viridis"`, `"plasma"`, or `"magma"`). To see the list of supported built-in schemes, or to add new custom schemes, see the [scheme documentation](../schemes).

- The `"category10"`, `"category20"` and similar color palettes are no longer available as built-in range names. Instead, they are available using the scale `"scheme"` property, which can be specified instead of a scale range for `"ordinal"` and `"sequential"` scales. However, Vega 3 does support a built-in `"category"` short-hand for ordinal scale ranges, which can be re-defined as part of the theme configuration.

- Vega 3 adds a new `"index"` scale type which maps an ordinal domain to a quantitative range (e.g., as supported by `"linear"` or `"sequential"` scales). This is particularly useful for creating ordered color ramps for ordinal data.

- Scale domains involving multiple data fields from the same table must now be listed under the `"fields"` property, not `"field"`. For example, `"domain": {"data": "table", "fields": ["fieldA", "fieldB"]}`.

[Back to outline](#outline)


## <a name="transforms"></a>Data Transforms

- Vega 3 also introduces a number of new transforms, and modifications to previous transforms (including a dramatically improved `"force"` transform and improved hierarchical layout support). Web-based documentation is still forthcoming. However, most of these transforms are demonstrated in the example specifications included in this repo. In addition, the parameters accepted by each transform are documented via JSDoc comments in the source code. Please consult the appropriate Vega module repositories for further information.

- Vega 2.x transform `"output"` maps for determining output field names have been removed. Instead, the relevant transforms accept an `"as"` parameter that (depending on the transform type) takes either a single string or an ordered array of strings, each representing a desired output field name. See the documentation (including JSDoc source code comments) for individual transforms for more information.

- Similarly, the `"formula"` transform `"field"` parameter has been renamed `"as"`.

- A number of transforms now have different default output field names. In most cases, this was done to make the values more easily serve as scenegraph item properties (for example, when using post-encoding transforms).

- For layout transforms suchs as `"pie"`, `"stack"`, and `"bin"`, midpoint calculations (e.g., `layout_mid`) are no longer included as output. Instead, one can use a `"signal"` expression to calulate a midpoint. For example, to compute the midpoints after a stack transform: `"y": {"scale": "yscale", "signal": "0.5 * (datum.y0 + datum.y1)"}).

- The `"aggregate"` transform no longer uses a `"summarize"` block for defining aggregation operations. In Vega 3, we instead use a flat set of (equal-length) arrays specifying the aggregation fields, operations and output field names:

  {:.suppress-error}
  ```json
  {
    "type": "aggregate",
    "groupby": ["category1", "category2"],
    "fields": ["measure1", "measure1", "measure2"],
    "ops": ["min", "max", "median"],
    "as": ["min1", "max1", "median2"]
  }
  ```

- For the `"bin"` transform:
  - The `"max"` and `"min"` parameters have been removed.  Instead, users can provide `"extent"`, a two-element (`[min, max]`) array indicating the range of desired bin values.
  - The `"div"` property has been renamed to `"divide"`.

- The `"filter"` transform `"test"` parameter has been renamed `"expr"` for consistency with other transforms that take an expression parameter.

- For the `"lookup"` transform, the `"on"`, `"onKey"` and `"keys"` parameters have been renamed `"from"`, `"key"`, and `"fields"`.

- The `"sort"` transform has been removed. In Vega 2, the sort transform was actually a no-op that added a special annotation to the pulse passing through it, which was later used to sort tuples at the _end_ of a transform pipeline. Vega 3 drops this behavior. Instead, there are two options for achieving sorting in a visualization: (1) Use a `"sort"` directive as part of a scale `"domain"` definition, or (2) use a `"collect"` transform and provide `"sort"` parameter. This ensures that sorting occurs immediately at the point at which it is requested, not at an indeterminate point down stream in the dataflow. We recommend using option (1) if workable, and (2) otherwise.

- The `"stack"` transform `"sortby"` parameter has been renamed `"sort"`.

[Back to outline](#outline)


## <a name="geo"></a>Geo Data

- Cartographic projections are now defined in their own top-level block, similar to scales. Named projections are defined within an array under the `projections` property. Inline projection definitions for geo transforms are no longer allowed. Instead, geo transforms include a `"projection"` parameter which takes the name of a defined projection.

- The `"geo"` transform has been renamed `"geopoint"`.

- A `"graticule"` transform has been added to generate reference lines for projections. To add graticules for a map, create a new "empty" data set definition (with no `"url"` or `"source"` properties), and include a `"graticule"` transform as the first entry in the data `"transforms"` array.

- In addition to the `"geopath"` transform, a `"geoshape"` transform has been added, which generates data for use with the new `shape` mark type. This mark type delays shape calculations until render time. Under canvas rendering, this can result in much faster draw times, as the projected geo-data does not need to be marshalled into an SVG path string.

[Back to outline](#outline)


## <a name="animation"></a>Animation

- Animated transitions are not currently supported by Vega 3.0. As a result, the `"delay"` and `"ease"` properties are no longer used.

[Back to outline](#outline)


## <a name="view"></a>View API

- The [Vega View API](../api/view) has been updated and streamlined. To create a Vega visualization, the Vega spec must first be parsed, the resulting *runtime specification* can then be passed as an argument to the `View` constructor. Unlike Vega 2.x, this process does *not* require asynchronous callbacks. For example:

  {:.suppress-error}
  ```js
  var runtime = vega.parse(spec); // may throw an Error if parsing fails
  var view = new vega.View(runtime)
    .logLevel(vega.Warn) // set view logging level
    .initialize(document.querySelector('#view')) // set parent DOM element
    .renderer('svg') // set render type (defaults to 'canvas')
    .hover() // enable hover event processing
    .run(); // update and render the view
  ```

- Instead of `view.update`, the [`view.run`](https://github.com/vega/vega-view#view_run) method now invokes dataflow pulse propagation and re-rendering.

- Instead of `view.destroy`, the [`view.finalize`](https://github.com/vega/vega-view#view_finalize) method should be called to prepare the view to be removed from a web page.

- The underlying View API and dataflow system have been extensively overhauled. A Vega `View` instance is now a direct subclass of a Vega `Dataflow`, and manages all reactive processing, streaming data input, and rendering. In addition to the [View API Reference](../api/view), comprehensive JSDoc comments are included in the source code of the [vega-view](https://github.com/vega/vega-view) and [vega-dataflow](https://github.com/vega/vega-dataflow) repositories.

[Back to outline](#outline)

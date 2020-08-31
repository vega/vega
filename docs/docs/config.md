---
layout: spec
title: Config
permalink: /docs/config/index.html
---

A **config** object defines default visual values to set a visualization's theme.

The Vega parser accepts a JSON configuration file that defines default settings for a variety of visual encoding choices. Different configuration files can be used to "theme" charts with a customized look and feel. A configuration file is simply a JSON object with a set of named properties, grouped by type. To provide a configuration file at parse-time, simply pass an additional parameter to the parse method:

```js
var runtime = vega.parse(spec, config);
```

In addition, Vega JSON specifications may contain a single, top-level `config` property to override any configuration settings. Any configuration provided within the specification itself will take precedence over external configurations passed to the parser.

For example, this Vega spec includes light-gray axis grid lines by default:

{: .suppress-error}
```json
{
  "width": 500,
  "height": 200,
  "config": {
    "axis": {
      "grid": true,
      "gridColor": "#dedede"
    }
  },
  ...
}
```

## <a name="reference"></a>Config Reference

- [View Properties](#view)
- [Event Properties](#events)
- [Mark Properties](#mark)
- [Style Properties](#style)
- [Axis Properties](#axes)
- [Legend Properties](#legends)
- [Title Properties](#title)
- [Projection Properties](#projection)
- [Scale Range Properties](#scale-range)
- [Signals](#signals)
{: .column-list }

## <a name="view"></a>View Properties

Properties defined in the top-level scope of the configuration object.

| Property      | Type                                 | Description    |
| :------------ | :----------------------------------: | :------------- |
| autosize      | {% include type t="String|Object|Signal" %} | Default automatic sizing setting. Valid string values are `"pad"`, `"fit"` or `"none"`. See the [autosize documentation](../specification/#autosize) for more. Signal support available in versions {% include tag ver="5.10" %}. |
| background    | {% include type t="Color|Signal" %}         | Background color of the view component, or `null` for transparent. Signal support available in versions {% include tag ver="5.10" %}. |
| description   | {% include type t="String" %}     | The default text description for visualizations. The description determines the [`aria-label` attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute) for the container element of a Vega view. {% include tag ver="5.10" %} |
| padding       | {% include type t="Number|Object|Signal" %} | The padding in pixels to add around the visualization. If a number, specifies padding for all sides. If an object, the value should have the format `{"left": 5, "top": 5, "right": 5, "bottom": 5}`. Signal support available in versions {% include tag ver="5.10" %}. |
| width         | {% include type t="Number|Signal" %} | The width in pixels of the data rectangle. {% include tag ver="5.10" %} |
| height        | {% include type t="Number|Signal" %} | The height in pixels of the data rectangle. {% include tag ver="5.10" %} |
| group         | {% include type t="Object" %}        | Default properties for the top-level group mark representing the data rectangle of a chart. Valid properties of this object are mark properties such as `"fill"`, `"stroke"` and `"strokeWidth"`. |
| locale        | {% include type t="Object" %}        | Locale definitions for string parsing and formatting of number and date values. The locale object should contain `number` and/or `time` properties with [locale definitions](../api/locale). Locale definitions provided in the config block may be overridden by the View constructor *locale* option. {% include tag ver="5.12" %} |
| lineBreak     | {% include type t="String|Signal" %} | A delimiter, such as a newline character, upon which to break text strings into multiple lines. This property provides a global default for text marks, which is overridden by mark or style config settings, and by the `lineBreak` mark encoding channel. If signal-valued, either string or regular expression (regexp) values are valid. {% include tag ver="5.10" %} |

### Usage

Set default view background and chart plotting area background colors:

```json
{
  "background": "white",
  "group": {
    "fill": "#dedede"
  }
}
```

Set the number and time format locale to German:

```json
{
  "locale": {
    "number": {
      "decimal": ",",
      "thousands": ".",
      "grouping": [3],
      "currency": ["", " €"]
    },
    "time": {
      "dateTime": "%A, der %e. %B %Y, %X",
      "date": "%d.%m.%Y",
      "time": "%H:%M:%S",
      "periods": ["AM", "PM"],
      "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
      "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      "shortMonths": [ "Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
    }
  }
}
```

[Back to Top](#reference)


## <a name="events"></a> Event Properties

Properties for event handling configuration, defined within an `"events"` property block.

| Property      | Type                                  | Description    |
| :------------ | :-----------------------------------: | :------------- |
| bind          | {% include type t="String" %}         | Configuration control for binding input DOM elements to signals. The available options are `"any"` (default, all bindings are allowed), `"container"` (use only the view container DOM element for all bindings, suppressing per-binding selectors), and `"none"` (suppresses all input bindings). {% include tag ver="5.5" %}|
| defaults      | {% include type t="Object" %}         | An object describing which events that originate within the Vega view should have their default behavior suppressed by invoking the [event.preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) method. The _defaults_ object should have a single property: either `"prevent"` (to indicate which events should have default behavior suppressed) or `"allow"` (to indicate only those events whose default behavior should be allowed). This property accepts either a boolean value (to prevent/allow all events) or an array of event type strings.|
| globalCursor  | {% include type t="Boolean" %}        | Configuration control for dynamic cursor setting. If `false` (default), the cursor is set for the Vega View element only. If `true`, the cursor is set globally for the entire document body. The default value of `false` avoids performance issues in browsers that recalculate styles in response to cursor changes. {% include tag ver="5.13" %}|
| selector      | {% include type t="Boolean|String[]" %} | Configuration control for event listeners for external sources specified using a CSS selector. If a boolean value, `true` (default) permits selector event listeners, `false` disallows all selector events. If a string array, the entries specify a list of event types (such as `"mousemove"` or `"wheel"`) to allow. {% include tag ver="5.5" %}|
| timer         | {% include type t="Boolean" %}        | Configuration control for event listeners for a `"timer"` source. One of `true` (default) to permit timer event listeners, or `false` to disallow timer events. {% include tag ver="5.5" %}|
| view          | {% include type t="Boolean|String[]" %} | Configuration control for event listeners for the Vega `"view"` source. If a boolean value, `true` (default) permits view event listeners, `false` disallows all view events. If a string array, the entries specify a list of event types (such as `"mousemove"` or `"wheel"`) to allow. {% include tag ver="5.5" %}|
| window        | {% include type t="Boolean|String[]" %} | Configuration control for event listeners for the browser `"window"` source. If a boolean value, `true` (default) permits window event listeners, `false` disallows all window events. If a string array, the entries specify a list of event types (such as `"mousemove"` or `"wheel"`) to allow. {% include tag ver="5.5" %}|

### Usage

To disable event listeners on external DOM elements specified by a CSS selector and permit only `mousemove` and `mouseup` events on the browser `window` object:

{: .suppress-error}
```json
"events": {
  "selector": false,
  "window": ["mousemove", "mouseup"]
}
```

To prevent the default behavior for all events originating within a Vega view:

{: .suppress-error}
```json
"events": {
  "defaults": {
    "prevent": true
  }
}
```

To prevent the default behavior for all events originating within a Vega view, except for `wheel` events:

{: .suppress-error}
```json
"events": {
  "defaults": {
    "allow": ["wheel"]
  }
}
```

[Back to Top](#reference)


## <a name="mark"></a> Mark Properties

Properties defining default property values for each mark type. These properties are defined within blocks with names matching a valid mark type (e.g., `"area"`, `"line"`, `"rect"`). The valid properties within each block consist of the legal mark properties (e.g., `"fill"`, `"stroke"`, `"size"`, `"font"`). Global defaults for _all_ mark types can be set using the `"mark"` property.

_Important limitations_:
- Defaults for fill or stroke color will be applied only if neither `"fill"` nor `"stroke"` are defined in the Vega spec.
- Defaults set using the top-level `"mark"` property will be overridden by any defaults defined for more specific mark types (e.g., `"rect"`). Vega's built-in configuration includes default fill or stroke colors for a number of specific mark types, and these will take precedence over new fill or stroke colors set only on the top-level `"mark"`.

### Usage

To set a default fill color and size for `symbol` marks:

```json
{
  "symbol": {
    "fill": "steelblue",
    "size": 64
  }
}
```

To set a global opacity value for all mark types:

```json
{
  "mark": {
    "opacity": 0.8
  }
}
```

[Back to Top](#reference)


## <a name="style"></a>Style Properties

In addition to the default mark properties above, default values can be further customized using named _styles_ defined under the `style` block
in the config. Styles can then be invoked by including a `style` directive within a mark definition.

For example, to set a default shape and stroke width for symbol marks with a style named `"square"`:

{: .suppress-error}
```json
"style": {
  "square": {
    "shape": "square",
    "strokeWidth": 2
  }
}
```

In addition to custom `style` names, Vega includes the following built-in style names:
- `guide-label`: styles for axis and legend labels
- `guide-title`: styles for axis and legend titles
- `group-title`: styles for chart and header titles

Style settings take precedence over default mark settings, but are overridden by the axis, legend, and title properties described below.

[Back to Top](#reference)


## <a name="axes"></a>Axis Properties

Properties defining default settings for axes. These properties are defined under the `"axis"` property in the config object, in which case the settings apply to _all_ axes.

Additional property blocks can target more specific axis types based on the orientation (`"axisX"`, `"axisY"`, `"axisLeft"`, `"axisTop"`, etc.) or band scale type (`"axisBand"`). For example, properties defined under the `"axisBand"` property will only apply to axes visualizing `"band"` scales. If multiple axis config blocks apply to a single axis, type-based options take precedence over orientation-based options, which in turn take precedence over general options.

| Property        | Type                            | Description    |
| :-------------- | :-----------------------------: | :------------- |
| bandPosition    | {% include type t="Number" %}   | An interpolation fraction indicating where, for `band` scales, axis ticks should be positioned. A value of `0` places ticks at the left edge of their bands. A value of `0.5` places ticks in the middle of their bands. |
| domain          | {% include type t="Boolean" %}  | Boolean flag indicating if axis domain line should be included by default. |
| domainCap       | {% include type t="String" %}   | The stroke cap for the axis domain line. One of `"butt"` (default), `"round"` or `"square"`. {% include tag ver="5.11" %} |
| domainColor     | {% include type t="Color" %}    | Color of axis domain line. |
| domainDash      | {% include type t="Number[]" %} | Stroke dash of axis domain lines (or `[]` for solid lines). {% include tag ver="5.0" %} |
| domainDashOffset| {% include type t="Number" %}   | The pixel offset at which to start the domain dash array. {% include tag ver="5.0" %} |
| domainOpacity   | {% include type t="Number" %}   | Opacity of axis domain line. {% include tag ver="4.1" %} |
| domainWidth     | {% include type t="Number" %}   | Stroke width of axis domain line. |
| grid            | {% include type t="Boolean" %}  | Boolean flag indicating if axis grid lines should be included by default. |
| gridCap         | {% include type t="String" %}   | The stroke cap for axis grid lines. One of `"butt"` (default), `"round"` or `"square"`. {% include tag ver="5.11" %} |
| gridColor       | {% include type t="Color" %}    | Color of axis grid lines. |
| gridDash        | {% include type t="Number[]" %} | Stroke dash of axis grid lines (or `[]` for solid lines). |
| gridDashOffset  | {% include type t="Number" %}   | The pixel offset at which to start the grid dash array. {% include tag ver="5.0" %} |
| gridOpacity     | {% include type t="Number" %}   | Opacity of axis grid lines. |
| gridWidth       | {% include type t="Number" %}   | Stroke width of axis grid lines. |
| labels          | {% include type t="Boolean" %}  | Boolean flag indicating if axis tick labels should be included by default. |
| labelAlign    | {% include type t="String" %}  | Horizontal text alignment of axis tick labels, overriding the default setting for the axis orientation. |
| labelAngle    | {% include type t="Number" %}  | Angle in degrees of axis tick labels. |
| labelBaseline   | {% include type t="String" %}  | Vertical text baseline of axis tick labels, overriding the default setting for the axis orientation. |
| labelBound      | {% include type t="Boolean|Number" %} | Boolean flag or pixel tolerance value for removal of labels that exceed the axis range. |
| labelColor      | {% include type t="Color" %}    | Text color of axis tick labels. |
| labelFlush      | {% include type t="Boolean|Number" %} | Boolean flag or pixel distance threshold value for performing a "flush" layout of axis labels. For an x-axis, flush alignment will left-align the left-most labels (if within the distance threshold from the axis start) and similarly right-align the right-most labels. If `true`, a pixel tolerance of 1 is used. |
| labelFlushOffset| {% include type t="Number" %} | Offset in pixels for flush-adjusted labels (default `0`). |
| labelFont       | {% include type t="String" %}   | Font name for axis tick labels. |
| labelFontSize   | {% include type t="Number" %}   | Font size of axis tick labels. |
| labelFontStyle  | {% include type t="String" %} | Font style of axis tick labels (e.g., `normal` or `italic`). {% include tag ver="5.0" %} |
| labelFontWeight | {% include type t="String|Number" %}   | Font weight of axis tick labels. |
| labelLimit      | {% include type t="Number" %}   | The maximum allowed length in pixels of axis tick labels. |
| labelLineHeight | {% include type t="Number" %}   | Line height in pixels for multi-line label text. {% include tag ver="5.10" %} |
| labelOffset     | {% include type t="Number" %}   | Position offset in pixels to apply to labels, in addition to *tickOffset*. {% include tag ver="5.10" %} |
| labelOpacity    | {% include type t="Number" %}   | Opacity of axis tick labels. {% include tag ver="4.1" %} |
| labelOverlap    | {% include type t="Boolean|String" %} | The strategy to use for resolving overlap of axis labels. If `false`, no overlap reduction is attempted. If `true` or `"parity"`, a strategy of removing every other label is used (this works well for standard linear axes). If `"greedy"`, a linear scan of the labels is performed, removing any labels that overlaps with the last visible label (this often works better for log-scaled axes).|
| labelSeparation | {% include type t="Number" %}  | The minimum separation that must be between label bounding boxes for them to be considered non-overlapping (default `0`). This property is ignored if *labelOverlap* resolution is not enabled. {% include tag ver="5.0" %} |
| labelPadding    | {% include type t="Number" %}   | Padding in pixels between axis ticks and tick labels. |
| maxExtent       | {% include type t="Number" %}   | The maximum extent in pixels that axis ticks and labels should use. This determines a maximum offset value for axis titles. |
| minExtent       | {% include type t="Number" %}   | The minimum extent in pixels that axis ticks and labels should use. This determines a minimum offset value for axis titles. |
| ticks           | {% include type t="Boolean" %}  | Boolean flag indicating if axis tick marks should be included by default. |
| tickBand        | {% include type t="String" %}   | Indicates the type of tick style to use in conjunction with band scales. One of `"center"` (default) to center ticks in the middle of the band interval, or `"extent"` to place ticks at band extents (interval boundaries). If specified, this property may override the settings of `bandPosition`, `tickExtra`, and `tickOffset`. {% include tag ver="5.8" %} |
| tickCap         | {% include type t="String" %}   | The stroke cap for axis tick marks. One of `"butt"` (default), `"round"` or `"square"`. {% include tag ver="5.11" %} |
| tickColor       | {% include type t="Color" %}    | Color of axis ticks. |
| tickDash        | {% include type t="Number[]" %} | Stroke dash of axis tick marks (or `[]` for solid lines). {% include tag ver="5.0" %} |
| tickDashOffset  | {% include type t="Number" %}   | The pixel offset at which to start the tick mark dash array. {% include tag ver="5.0" %} |
| tickExtra       | {% include type t="Boolean" %}  | Boolean flag indicating if an extra axis tick should be added for the initial position of the axis. This flag is useful for styling axes for `band` scales such that ticks are placed on band boundaries rather in the middle of a band. Use in conjunction with `"bandPosition": 1` and an axis `"padding"` value of `0`. |
| tickOffset      | {% include type t="Number" %}   | Position offset in pixels to apply to ticks, labels, and gridlines. |
| tickOpacity     | {% include type t="Number" %}   | Opacity of axis ticks. {% include tag ver="4.1" %} |
| tickRound       | {% include type t="Boolean" %}  | Boolean flag indicating if pixel position values should be rounded to the nearest integer. |
| tickSize        | {% include type t="Number" %}   | Size, or length, in pixels of axis ticks. |
| tickWidth       | {% include type t="Number" %}   | Width in pixels of axis ticks. |
| titleAlign      | {% include type t="String" %}   | Horizontal text alignment of axis titles. One of `"left"`, `"center"`, or `"right"`. If specified, this value overrides automatic alignment based on the _titleAnchor_ value. |
| titleAnchor   | {% include type t="String" %}  | The anchor position for placing axis titles. One of `"start"`, `"middle"`, `"end"`, or `null` (default, for automatic determination). For example, with an _orient_ of `"bottom"` these anchor positions map to a left-, center-, or right-aligned title. The anchor point is determined relative to the axis scale range. {% include tag ver="5.0" %} |
| titleAngle      | {% include type t="Number" %}   | Angle in degrees of axis titles. |
| titleBaseline   | {% include type t="String" %}   | Vertical text baseline for axis titles. |
| titleColor      | {% include type t="Color" %}    | Text color of axis titles. |
| titleFont       | {% include type t="String" %}   | Font name for axis titles. |
| titleFontSize   | {% include type t="Number" %}   | Font size of axis titles. |
| titleFontStyle  | {% include type t="String" %} | Font style of axis titles (e.g., `normal` or `italic`). {% include tag ver="5.0" %} |
| titleFontWeight | {% include type t="String|Number" %}   | Font weight of axis titles. |
| titleLimit      | {% include type t="Number" %}   | The maximum allowed length in pixels of axis titles. |
| titleLineHeight | {% include type t="Number" %}   | Line height in pixels for multi-line title text. {% include tag ver="5.7" %} |
| titleOpacity    | {% include type t="Number" %}   | Opacity of axis titles. {% include tag ver="4.1" %} |
| titlePadding    | {% include type t="Number" %}   | Padding in pixels between axis tick labels and titles. |
| titleX          | {% include type t="Number" %}   | X-coordinate of the axis title relative to the axis group. |
| titleY          | {% include type t="Number" %}   | Y-coordinate of the axis title relative to the axis group. |
| translate       | {% include type t="Number" %}   | Coordinate space translation offset for axis layout. By default, axes are translated by a 0.5 pixel offset for both the x and y coordinates, in order to align stroked lines with the pixel grid. However, for vector graphics output these pixel-specific adjustments may be undesirable, in which case `translate` can be changed (for example, to zero). {% include tag ver="5.8" %} |
| zindex          | {% include type t="Number" %}   | The integer z-index indicating the layering of the axis group relative to other axis, mark, and legend groups. With a value of `0` axes and grid lines are drawn _behind_ any marks defined in the same specification level. Higher values (`1`) cause axes and grid lines to be drawn on top of marks. {% include tag ver="5.11" %} |

### <a name="axes-accessibility"></a>Axis Accessibility Properties

Accessibility properties are used to determine [ARIA (Accessible Rich Internet Applications) attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) when using Vega to render SVG output.

| Property              | Type                            | Description    |
| :-------------------- | :-----------------------------: | :------------- |
| aria                  | {% include type t="Boolean" %}  | A boolean flag (default `true`) indicating if ARIA attributes should be included (SVG output only). If `false`, the "aria-hidden" attribute will be set on the output SVG group, removing the axis from the ARIA accessibility tree. {% include tag ver="5.11" %}|
| description           | {% include type t="String" %}   | A text description of this axis for ARIA accessibility (SVG output only). If the *aria* property is `true`, for SVG output the ["aria-label" attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute) will be set to this description. If the description is unspecified it will be automatically generated. {% include tag ver="5.11" %}|

### Usage

This example sets the axis label color to dark gray for all axes, and rotates the labels for axes oriented along the bottom of a chart.

```json
{
  "axis": {
    "labelColor": "#ccc"
  },
  "axisBottom": {
    "labelAngle": -90
  }
}
```

[Back to Top](#reference)


## <a name="legends"></a>Legend Properties

Properties defining default settings for legends. These properties are defined under the `"legend"` property within the config object.

| Property              | Type                            | Description    |
| :-------------------- | :-----------------------------: | :------------- |
| clipHeight            | {% include type t="Number" %}   | The height in pixels to clip symbol legend entries and limit their size. |
| columns               | {% include type t="Number" %}   | The number of columns in which to arrange symbol legend entries. A value of `0` or lower indicates a single row with one column per entry. |
| columnPadding         | {% include type t="Number" %}   | The horizontal padding in pixels between symbol legend entries. |
| cornerRadius          | {% include type t="Number" %}   | Corner radius for the full legend. |
| fillColor             | {% include type t="Color" %}    | Background fill color for the full legend. |
| gradientDirection     | {% include type t="String" %}   | The default direction (`"horizontal"` or `"vertical"`) for gradient legends. |
| gradientLength        | {% include type t="Number" %}   | The length in pixels of the primary axis of a color gradient. This value corresponds to the height of a vertical gradient or the width of a horizontal gradient. |
| gradientThickness     | {% include type t="Number" %}   | The thickness in pixels of the color gradient. This value corresponds to the width of a vertical gradient or the height of a horizontal gradient. |
| gradientWidth         | {% include type t="Number" %}   | Deprecated, use _gradientLength_ instead. If _gradientLength_ is not defined, this value will be used instead. |
| gradientHeight        | {% include type t="Number" %}   | Deprecated, use _gradientThickness_ instead. If _gradientThickness_ is not defined, this value will be used instead. |
| gradientStrokeColor   | {% include type t="Color" %}    | Stroke color for color ramp gradient borders. |
| gradientStrokeWidth   | {% include type t="Number" %}   | Stroke width for color ramp gradient borders. |
| gradientLabelLimit    | {% include type t="Number" %}   | The maximum allowed length in pixels of color ramp gradient labels. |
| gradientLabelOffset   | {% include type t="Number" %}   | Vertical offset in pixels for color ramp gradient labels. |
| gradientOpacity       | {% include type t="Number" %}   | Opacity of color ramp gradient. {% include tag ver="4.1" %} |
| gridAlign             | {% include type t="String" %}   | The alignment to apply to symbol legends rows and columns. The supported string values are `all`, `each` (the default), and `none`. For more information, see the [grid layout documentation](../layout). |
| labelAlign            | {% include type t="String" %}   | Horizontal text alignment of legend labels. |
| labelBaseline         | {% include type t="String" %}   | Vertical text baseline of legend labels. |
| labelColor            | {% include type t="Color" %}    | Text color of legend labels. |
| labelFont             | {% include type t="String" %}   | Font name of legend labels. |
| labelFontSize         | {% include type t="Number" %}   | Font size in pixels of legend labels. |
| labelFontStyle        | {% include type t="String" %}   | Font style of legend labels (e.g., `normal` or `italic`). {% include tag ver="5.0" %} |
| labelFontWeight       | {% include type t="String|Number" %}   | Font weight of legend labels. |
| labelLimit            | {% include type t="Number" %}   | The maximum allowed length in pixels of legend labels. |
| labelOffset           | {% include type t="Number" %}   | Horizontal offset in pixels between legend symbols and labels. |
| labelOpacity          | {% include type t="Number" %}   | Opacity of legend labels. {% include tag ver="4.1" %} |
| labelOverlap          | {% include type t="Boolean|String" %} | The strategy to use for resolving overlap of labels in gradient legends. If `false`, no overlap reduction is attempted. If set to `true` (default) or `"parity"`, a strategy of removing every other label is used. If set to `"greedy"`, a linear scan of the labels is performed, removing any label that overlaps with the last visible label.|
| labelSeparation       | {% include type t="Number" %}   | The minimum separation that must be between label bounding boxes for them to be considered non-overlapping (default `0`). This property is ignored if *labelOverlap* resolution is not enabled. {% include tag ver="5.0" %} |
| layout                | [Layout](#legends-layout)       | An object specifying layout parameters for positioning a collection of legends with the same *orient* value. {% include tag ver="5.0" %} |
| legendX               | {% include type t="Number" %}   | The pixel x-coordinate of the legend group. Only applied if the _orient_ value is `"none"`. {% include tag ver="5.4" %} |
| legendY               | {% include type t="Number" %}   | The pixel y-coordinate of the legend group. Only applied if the _orient_ value is `"none"`. {% include tag ver="5.4" %} |
| offset                | {% include type t="Number" %}   | Offset in pixels of the legend from the chart body. If specified, this value will override any values specified in the [legend layout config](#legends-layout).|
| orient                | {% include type t="String" %}   | Default legend orientation (e.g., `"right"` or `"left"`). |
| padding               | {% include type t="Number" %}   | Padding in pixels between legend border and contents. |
| rowPadding            | {% include type t="Number" %}   | The vertical padding in pixels between symbol legend entries. |
| strokeColor           | {% include type t="Color" %}    | Border stroke color for the full legend. |
| strokeDash            | {% include type t="Number[]" %} | Border stroke dash pattern for the full legend. |
| strokeWidth           | {% include type t="Number" %}   | Border stroke width for the full legend. |
| symbolBaseFillColor   | {% include type t="Color" %}    | Default fill color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend. |
| symbolBaseStrokeColor | {% include type t="Color" %}    | Default stroke color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend. |
| symbolDash            | {% include type t="Number[]" %} | Stroke dash of symbol outlines (or `[]` for solid lines). {% include tag ver="5.0" %} |
| symbolDashOffset      | {% include type t="Number" %}   | The pixel offset at which to start the symbol dash array. {% include tag ver="5.0" %} |
| symbolDirection       | {% include type t="String" %}   | The default direction (`"horizontal"` or `"vertical"`) for symbol legends. |
| symbolFillColor       | {% include type t="Color" %}    | Fill color for legend symbols. |
| symbolLimit           | {% include type t="Number" %}   | The maximum number of allowed entries for a symbol legend. If the number of entries exceeds the limit, entries will be dropped and replaced with an ellipsis. {% include tag ver="5.7" %} |
| symbolOffset          | {% include type t="Number" %}   | Horizontal pixel offset for legend symbols. |
| symbolOpacity         | {% include type t="Number" %}   | Opacity of legend symbols. {% include tag ver="4.1" %} |
| symbolSize            | {% include type t="Number" %}   | Default symbol area size (in pixels<sup>2</sup>). |
| symbolStrokeColor     | {% include type t="Color" %}    | Stroke color for legend symbols. |
| symbolStrokeWidth     | {% include type t="Number" %}   | Default legend symbol stroke width. |
| symbolType            | {% include type t="String" %}   | Default shape type (such as `"circle"`) for legend symbols. |
| tickCount             | {% include type t="Number|String|Object" %} | The desired number of tick values for quantitative legends. For scales of type `time` or `utc`, the tick count can instead be a time interval specifier. Legal string values are `"millisecond"`, `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, and `"year"`. Alternatively, an object-valued interval specifier of the form `{"interval": "month", "step": 3}` includes a desired number of interval steps. Here, ticks are generated for each quarter (Jan, Apr, Jul, Oct) boundary. {% include tag ver="5.7" %} |
| titleAlign            | {% include type t="String" %}   | Horizontal text alignment of legend titles. One of `"left"`, `"center"`, or `"right"`. If specified, this value overrides automatic alignment based on the _titleOrient_ and _titleAnchor_ values. |
| titleAnchor           | {% include type t="String" %}   | The anchor position for placing legend titles. One of `"start"`, `"middle"`, `"end"`, or `null` (default, for automatic determination). For example, with a _titleOrient_ of `"top"` these anchor positions map to a left-, center-, or right-aligned title relative to the legend contents. {% include tag ver="5.0" %} |
| titleBaseline         | {% include type t="String" %}   | Vertical text baseline of legend titles. If specified, this value overrides the automatic baseline based on the _titleOrient_ and _titleAnchor_ values. |
| titleColor            | {% include type t="Color" %}    | Text color of legend titles. |
| titleFont             | {% include type t="String" %}   | Font name of legend titles. |
| titleFontSize         | {% include type t="Number" %}   | Font size in pixels of legend titles. |
| titleFontStyle        | {% include type t="String" %}   | Font style of legend titles (e.g., `normal` or `italic`). {% include tag ver="5.0" %} |
| titleFontWeight       | {% include type t="String|Number" %}   | Font weight for legend titles. |
| titleLimit            | {% include type t="Number" %}   | The maximum allowed length in pixels of legend titles. |
| titleLineHeight       | {% include type t="Number" %}   | Line height in pixels for multi-line title text. {% include tag ver="5.7" %} |
| titleOpacity          | {% include type t="Number" %}   | Opacity of legend titles. {% include tag ver="4.1" %} |
| titleOrient           | {% include type t="String" %}  | The orientation of title legends, determining where they are placed relative to legend contents. One of `"top"` (default), `"left"`, `"bottom"`, or `"right"`. {% include tag ver="5.0" %} |
| titlePadding          | {% include type t="Number" %}   | Padding in pixels between the legend title and entries. |
| zindex                | {% include type t="Number" %}   | The integer z-index indicating the layering of the legend group relative to other axis, mark, and legend groups. {% include tag ver="5.11" %} |

### <a name="legends-accessibility"></a>Legend Accessibility Properties

Accessibility properties are used to determine [ARIA (Accessible Rich Internet Applications) attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) when using Vega to render SVG output.

| Property              | Type                            | Description    |
| :-------------------- | :-----------------------------: | :------------- |
| aria                  | {% include type t="Boolean" %}  | A boolean flag (default `true`) indicating if ARIA attributes should be included (SVG output only). If `false`, the "aria-hidden" attribute will be set on the output SVG group, removing the legend from the ARIA accessibility tree. {% include tag ver="5.11" %}|
| description           | {% include type t="String" %}   | A text description of this legend for ARIA accessibility (SVG output only). If the *aria* property is `true`, for SVG output the ["aria-label" attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute) will be set to this description. If the description is unspecified it will be automatically generated. {% include tag ver="5.11" %}|

### <a name="legends-layout"></a>Legend Layout Properties {% include tag ver="5.0" %}

Collections of legends with the same *orient* value are positioned together, either vertically or horizontally in sequence. The legend *layout* property enables customization of how legends are organized within a Vega view. The *layout* property is an object value that may contain both top-level properties that apply to all legends and a set of *orient*-specific properties for customizing specific legend orientations.

| Property              | Type                            | Description    |
| :-------------------- | :-----------------------------: | :------------- |
| anchor                | {% include type t="String" %}   | An anchor value determining the placement of the legends relative to the nearest axis. One of `"start"` (default), `"middle"`, or `"end"`. For example, for legends with *orient* `"top"`, these values respectively correspond to anchoring the legends to the left edge, center, or right edge of the charting area. This property only applies to axes with an *orient* value of `"left"`, `"right"`, `"top"`, or `"bottom"`.|
| bounds                | {% include type t="String" %}   | The type of bounding box calculation to use for calculating legend extents. One of `"flush"` (the default, for using legend width and height values only) or `"full"` (to use the full bounding box, for example including border stroke widths).|
| center                | {% include type t="Boolean" %}  | A boolean flag (default `false`) indicating if legends should be centered within the respective layout area. For example, given a vertical direction, two legends will share a left edge by default. If *center* is true, the smaller legends will be centered in the space spanned by all the legends.|
| direction             | {% include type t="String" %}   | The direction in which subsequent legends should be spatially positioned. One of `"horizontal"` or `"vertical"`.|
| margin                | {% include type t="Number" %}   | Margin, in pixels, to place between consecutive legends with the same *orient* value. |
| offset                | {% include type t="Number" %}   | Offset, in pixels, of the legend from the chart body. |

In addition to these top-level properties, the legend layout may include sub-objects (containing the same properties listed above) for any of the legal [legend *orient* values](../legends/#orientation) other than `"none"`: `"left"`, `"right"`, `"top"`, `"bottom"`, `"top-left"`, `"top-right"`, `"bottom-left"`, `"bottom-right"`.

**Note**: The [default configuration](https://github.com/vega/vega/blob/master/packages/vega-parser/src/config.js) includes legend layout entries for `"left"` and `"right"` orientations. If you add custom layout parameters at the top-level, these will _not_ override more specific configurations. If you want to modify the layout of `"left"`- or `"right"`-oriented legends, use a specific sub-object targeting those orientations.

### Usage

This example gives every legend a 10 pixel padding and a light gray border:

```json
{
  "legend": {
    "padding": 10,
    "legendStrokeColor": "#ccc",
    "legendStrokeWidth": 1
  }
}
```

This example customizes the layout of legends with *orient* value `"bottom"`, stacking those legends vertically with 2 pixel margins, anchoring their x-positon to the middle of the chart area, and centering the legends within their layout area:

```json
{
  "legend": {
    "layout": {
      "bottom": {
        "anchor": "middle",
        "direction": "vertical",
        "center": true,
        "margin": 2,
      }
    }
  }
}
```

[Back to Top](#reference)


## <a name="title"></a>Title Properties

Properties defining default settings for titles. These properties are defined under the `"title"` property within the config object.

| Property              | Type                            | Description    |
| :-------------------- | :-----------------------------: | :------------- |
| align                 | {% include type t="String" %}   | Horizontal text alignment of the title and subtitle. If specified, this value overrides automatic alignment based on the _anchor_ value. |
| anchor                | {% include type t="String" %}   | Title and subtitle anchor position (`"start"`, `"middle"`, or `"end"`). |
| angle                 | {% include type t="Number" %}   | Angle in degrees of the title and subtitle text. |
| baseline              | {% include type t="String" %}   | Vertical text baseline of the title and subtitle. |
| color                 | {% include type t="Color" %}    | Text color of the title text. |
| dx                    | {% include type t="Number" %}   | Horizontal offset added to the title and subtitle x-coordinate. {% include tag ver="5.2" %} |
| dy                    | {% include type t="Number" %}   | Vertical offset added to the title and subtitle y-coordinate. {% include tag ver="5.2" %} |
| font                  | {% include type t="String" %}   | Font name of the title text. |
| fontSize              | {% include type t="Number" %}   | Font size in pixels of the title text. |
| fontStyle             | {% include type t="String" %}   | Font style of the title text (e.g., `normal` or `italic`). {% include tag ver="5.0" %} |
| fontWeight            | {% include type t="String|Number" %}   | Font weight for title text. |
| frame                 | {% include type t="String" %}   | The reference frame for the anchor position, one of `"bounds"` (to anchor relative to the full bounding box) or `"group"` (to anchor relative to the group width or height). |
| limit                 | {% include type t="Number" %}   | The maximum allowed length in pixels of title and subtitle text. |
| lineHeight            | {% include type t="Number" %}   | Line height in pixels for multi-line title text. {% include tag ver="5.7" %} |
| offset                | {% include type t="Number" %}   | Offset in pixels of the title from the chart body and axes. |
| orient                | {% include type t="String" %}   | Default title orientation (`"top"`, `"bottom"`, `"left"`, or `"right"`). |
| subtitleColor         | {% include type t="Color" %}    | Text color of the subtitle text. {% include tag ver="5.7" %} |
| subtitleFont          | {% include type t="String" %}   | Font name of the subtitle text. {% include tag ver="5.7" %} |
| subtitleFontSize      | {% include type t="Number" %}   | Font size in pixels of the subtitle text. {% include tag ver="5.7" %} |
| subtitleFontStyle     | {% include type t="String" %}   | Font style of the subtitle text (e.g., `normal` or `italic`). {% include tag ver="5.7" %} |
| subtitleFontWeight    | {% include type t="String|Number" %}   | Font weight for subtitle text. {% include tag ver="5.7" %} |
| subtitleLineHeight    | {% include type t="Number" %}   | Line height in pixels for multi-line subtitle text. {% include tag ver="5.7" %} |
| subtitlePadding       | {% include type t="Number" %}   | Padding in pixels between title and subtitle text. {% include tag ver="5.7" %} |
| zindex                | {% include type t="Number" %}   | The integer z-index indicating the layering of the title group relative to other axis, mark, and legend groups. {% include tag ver="5.11" %} |

### <a name="title-accessibility"></a>Title Accessibility Properties

Accessibility properties are used to determine [ARIA (Accessible Rich Internet Applications) attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) when using Vega to render SVG output.

| Property              | Type                            | Description    |
| :-------------------- | :-----------------------------: | :------------- |
| aria                  | {% include type t="Boolean" %}  | A boolean flag (default `true`) indicating if ARIA attributes should be included (SVG output only). If `false`, the "aria-hidden" attribute will be set on the output SVG group, removing the title from the ARIA accessibility tree. {% include tag ver="5.11" %}|

### Usage

This example gives every title a 10 pixel offset and a font size of 18 pixels.

```json
{
  "title": {
    "offset": 10,
    "fontSize": 18
  }
}
```

[Back to Top](#reference)


## <a name="projection"></a>Projection Properties

Default properties to apply to [cartographic projections](../projections), if not explicitly included in the input JSON specification. Any legal projection property may be included. These properties are defined under the `"projection"` property in the config object. A common use for this property is to set a default projection type.

### Usage

This example sets the default projection type to be an `"equalEarth"` projection:

```json
{
  "projection": {
    "type": "equalEarth"
  }
}
```


[Back to Top](#reference)


## <a name="scale-range"></a>Scale Range Properties

Properties defining named range arrays that can be used within scale range definitions (such as `{"type": "ordinal", "range": "category"}`). These properties are defined under the `"range"` property in the config object.

Object-valued properties must be legal [scale range](../scales/#range) definitions.

{% capture scheme %}[Scheme](../schemes){% include or %}{% include type t="Color[]" %}{% endcapture %}
| Property  | Type         | Description    |
| :-------- | :----------: | :------------- |
| category  | {{ scheme }} | Default [color scheme](../schemes) for categorical data. |
| diverging | {{ scheme }} | Default [color scheme](../schemes) for diverging quantitative ramps. |
| heatmap   | {{ scheme }} | Default [color scheme](../schemes) for quantitative heatmaps. |
| ordinal   | {{ scheme }} | Default [color scheme](../schemes) for rank-ordered data. |
| ramp      | {{ scheme }} | Default [color scheme](../schemes) for sequential quantitative ramps. |
| symbol    | {% include type t="String[]" %} | Array of [symbol](../marks/symbol) names or paths for the default shape palette. |


### Usage

This example sets new default color palettes.

```json
{
  "range": {
    "category": [
      "#5079a5",
      "#ef8e3b",
      "#dd565c",
      "#79b7b2",
      "#5da052",
      "#ecc853",
      "#ad7aa1",
      "#ef9ba7",
      "#9b7461",
      "#bab0ac"
    ],
    "ordinal": {"scheme": "greens"},
    "ramp": {"scheme": "purples"}
  }
}
```

[Back to Top](#reference)


## <a name="signals"></a>Signal Definitions {% include tag ver="5.5" %}

Configuration files may also contain signal definitions for the top-level scope of a Vega specification. The syntax is identical to [standard signal definitions](../signals/): an array of named signal objects. Adding signal definitions to a configuration can be useful for defining style variables (colors, font sizes, etc.) that may be used elsewhere within either the config or a spec itself. Signals directly defined within a specification itself take precedence over those defined in the configuration.

### Usage

To enable dynamic scaling of font sizes, one can define a signal that for a font size scale factor, then define other config entries relative to this value:

```json
{
  "signals": [
    {"name": "fontSizeScale", "value": 1}
  ],
  "text": {
    "fontSize": {"signal": "11 * fontSizeScale"}
  }
}
```

[Back to Top](#reference)

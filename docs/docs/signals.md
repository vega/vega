---
layout: spec
title: Signals
permalink: /docs/signals/index.html
---

**Signals** are dynamic variables that parameterize a visualization and can drive interactive behaviors. Signals can be used throughout a Vega specification, for example to define a mark property or data transform parameter.

Signal values are _reactive_: they can update in response to input event streams, external API calls, or changes to upstream signals. [Event streams](../event-streams) capture and sequence input events, such as `mousedown` or `touchmove`. When an event occurs, signals with associated event handlers are re-evaluated in their specification order. Updated signal values then propagate to the rest of the specification, and the visualization is re-rendered automatically.

A signal definition, and its use in the rest of a specification, looks something like this:


{: .suppress-error}
```json
{
  "signals": [
    {
      "name": "indexDate",
      "description": "A date value that updates in response to mousemove.",
      "update": "datetime(2005, 0, 1)",
      "on": [{"events": "mousemove", "update": "invert('xscale', x())"}]
    }
  ],
  "data": [
    { "name": "stocks", ... },
    {
      "name": "index",
      "source": "stocks",
      "transform": [
        {
          "type": "filter",
          "expr": "month(datum.date) === month(indexDate)"
        }
      ]
    }
  ],
  "scales": [
    { "name": "x", "type": "time", ... }
  ],
  "marks": [
    {
      "type": "rule",
      "encode": {
        "update": {
          "x": {"scale": "x", "signal": "indexDate"}
        }
      }
    }
  ]
}
```

## Signal Properties

Signal definitions may use the following properties.

| Property            | Type                | Description  |
| :------------------ | :-----------------: | :------------|
| name                | {% include type t="String" %}  | {% include required %} A unique name for the signal. Signal names should be valid [JavaScript identifiers](https://developer.mozilla.org/en-US/docs/Glossary/Identifier): they should contain only alphanumeric characters (or "$", or "_") and may not start with a digit. Reserved keywords that may **not** be used as signal names are `"datum"`, `"event"`, `"item"`, and `"parent"`.|
| bind                | [Bind](#bind)                  | Binds the signal to an external input element such as a slider, selection list or radio button group.|
| description         | {% include type t="String" %}  | A text description of the signal, useful for inline documentation.|
| on                  | {% include array t="[Handler](#handlers)" %} | An array of [event stream handlers](#handlers) for updating the signal value in response to input events.|
| init                | [Expression](../expressions)   | {% include tag ver="4.4" %} An initialization expression for the value of the signal. This expression will be invoked once and only once. The _init_ and _update_ parameters are mutually exclusive and can not be used together.|
| update              | [Expression](../expressions)   | An update expression for the value of the signal. This expression may include other signals, in which case the signal will automatically update in response to upstream signal changes, so long as the _react_ property is not `false`. The _init_ and _update_ parameters are mutually exclusive and can not be used together.|
| react               | {% include type t="Boolean" %} | A boolean flag (default `true`) indicating if the _update_ expression should be automatically re-evaluated when any upstream signal dependencies update. If `false`, the update expression will not register any dependencies on other signals, even for initialization.|
| value               | {% include type t="Any" %}     | The initial value of the signal (default `undefined`). This value is assigned prior to evaluating either the _init_ or _update_ expression.|

### Built-in signals

A few signal names are automatically processed and/or reserved:

- Signals for the [specification](../specification) `width`, `height`, `padding`, `autosize`, and (for version {% include tag ver="5.10" %}) `background` properties are automatically defined. Specifications may include definitions for these signals in the top-level `signals` array, in which case the definitions will be merged with any top-level [specification](../specification) property values, with precedence given to properties defined in the `signals` array.
- Group mark instances automatically include a `parent` signal bound to the data object for that group. Specifications may **not** define a signal named `parent`.
- The signal names `datum`, `item`, and `event` are reserved for top-level variables within expressions. Specifications may **not** define signals named `datum`, `item` or `event`.
- If you define a signal named `cursor`, its value will automatically drive the [CSS mouse cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) for the Vega view. For more, see the [`cursor` signal documentation](#cursor) below.

### <a name="cursor"></a>The `cursor` Signal

By default, Vega will style the mouse pointer when it is over a mark with a defined `cursor` property. However, in some interactive use cases, the cursor style should persist for the entire duration of an interaction (e.g., while dragging, regardless if the cursor remains over the item where the drag initiated). For more control, Vega provides a dedicated `cursor` signal. When the value of this signal is set, Vega uses it in lieu of any cursor properties set on marks. If the value is set to `"default"`, Vega resumes using the mark-based `cursor` property.

### Nested Signals

Signals can be defined either in the top-level scope of a specification or within a group mark definition. If a signal is defined within a nested group, it is accessible _only_ within the scope of that group; any marks, axes, legends, _etc._ that reference the signal must be contained within the group. If a nested signal has the same name as a signal defined in an outer scope, the new signal will _override_ the previously defined signal.

In addition to new signal definitions, nested group marks may contain _signal updates_ that target a signal defined in an outer scope. The `"push": "outer"` property indicates that, rather than create a new signal, updates should explicitly target an existing signal. Nested signal updates may **not** include _value_ or _update_ properties. The supported properties for signal updates are:

| Property            | Type                           | Description  |
| :------------------ | :----------------------------: | :------------|
| name                | {% include type t="String" %}  | {% include required %} The name of the signal to update.|
| push                | {% include type t="String" %}  | {% include required %} To indicate an update to a signal defined in an outer scope, the _push_ property must be set to `"outer"`.|
| description         | {% include type t="String" %}  | A text description of the signal, useful for documentation.|
| on                  | {% include array t="[Handler](#handlers)" %} | An array of [event stream handlers](#handlers) for updating the signal value in response to input events.|


## <a name="handlers"></a>Event Handlers

An event handler object includes an [event stream](../event-streams) definition indicating which _events_ to respond to, and either an _update_ expression for setting a new signal value, or an _encode_ set for updating the mark being interacted with.

| Property            | Type                            | Description  |
| :------------------ | :-----------------------------: | :------------|
| events              | [EventStream](../event-streams) | {% include required %} The events to respond to.|
| update              | [Expression](../expressions)    | An expression that is evaluated when events occur, the result then becomes the new signal value. This property is _**required**_ if _encode_ is not specified.|
| encode              | {% include type t="String" %}   | The name of a mark property encoding set to re-evaluate for the mark item that was the source of the input event. This property is _**required**_ if _update_ is not specified.|
| force               | {% include type t="Boolean" %}  | A boolean flag (default `false`) indicating whether or not updates that do not change the signal value should propagate. For example, if set to `true` and an input stream update sets the signal to its current value, downstream signals will still be notified of an update.|

This signal definition increments its value upon `mouseover` of `rect` items:

```json
{
  "name": "count",
  "value": 0,
  "on": [
    {"events": "rect:mouseover", "update": "count + 1"}
  ]
}
```

This signal definition invokes a custom encoding set upon `mousedown` and `mouseup` on mark items. The mark definition must include properties named `"select"` and `"release"` under the mark `"encode"` property.

```json
{
  "name": "clickEncode",
  "on": [
    {"events": "*:mousedown", "encode": "select"},
    {"events": "*:mouseup", "encode": "release"}
  ]
}
```


## <a name="bind"></a>Input Element Binding

The _bind_ property binds a signal to an input element defined outside of the visualization. Vega will generate new HTML form elements and set up a two-way binding: changes to the input element will update the signal, and vice versa. Vega includes dedicated support for `checkbox` (single boolean value), `radio` (group of radio buttons), `select` (drop-down menu), and `range` (slider) input types. Alternatively, Vega can also bind directly to [externally-defined input elements](#bind-external).

| Property            | Type                           | Description  |
| :------------------ | :----------------------------: | :------------|
| input               | {% include type t="String" %}  | {% include required %} The type of input element to use. The valid values are `checkbox`, `radio`, `range`, `select`, and any other legal [HTML form input type](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input).|
| element             | {% include type t="String" %}  | An optional CSS selector string indicating the parent element to which the input element should be added. By default, all input elements are added within the parent container of the Vega view.|
| name                | {% include type t="String" %}  | By default, the signal name is used to label input elements. This `name` property can be used to specify a custom label instead for the bound signal. |
| debounce            | {% include type t="Number" %}  | If defined, delays event handling until the specified milliseconds have elapsed since the last event was fired.|

### Radio and Select Input Properties

| Property            | Type                           | Description  |
| :------------------ | :----------------------------: | :------------|
| options             | {% include type t="Array" %}   | {% include required %} An array of options to select from.|
| labels              | {% include type t="String[]" %}| {% include tag ver="5.9" %} An array of label strings to represent the *options* values. If unspecified, the *options* value will be coerced to a string and used as the label. |
| name                | {% include type t="String" %}  | By default, the signal name is used to label input elements. This `name` property can be used to specify a custom label instead for the bound signal. |
| debounce            | {% include type t="Number" %}  | If defined, delays event handling until the specified milliseconds have elapsed since the last event was fired.|

### Range Input Properties

| Property            | Type                           | Description  |
| :------------------ | :----------------------------: | :------------|
| max                 | {% include type t="Number" %}  | For `range` inputs, sets the maximum slider value. Defaults to the larger of the signal value and `100`.|
| min                 | {% include type t="Number" %}  | For `range` inputs, sets the minimum slider value. Defaults to the smaller of the signal value and `0`.|
| step                | {% include type t="Number" %}  | For `range` inputs, sets the minimum slider increment. If undefined, the step size will be automatically determined based on the _min_ and _max_ values.|
| name                | {% include type t="String" %}  | By default, the signal name is used to label input elements. This `name` property can be used to specify a custom label instead for the bound signal. |
| debounce            | {% include type t="Number" %}  | If defined, delays event handling until the specified milliseconds have elapsed since the last event was fired.|

### Other Input Types

In addition, any valid [HTML input type](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) may be used as the value of the _input_ property. Examples include `"text"` (for single-line text entry), `"color"` (for a color picker), and `"date"` (for entering year, month and day).
In these cases, any extra properties defined (e.g., _placeholder_ for `"text"` input) will be added as attributes of the generated HTML form element.

### <a name="bind-external"></a>Binding Directly to External Elements

Rather than generate its own input elements, Vega also supports binding directly to an existing element defined externally. To do so, the *input* property must be undefined, and the *element* property must reference an existing, externally defined element.

| Property            | Type                           | Description  |
| :------------------ | :----------------------------: | :------------|
| element             | {% include type t="String" %}  | {% include required %} An input element that exposes a *value* property and supports the [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) interface, or a CSS selector string to such an element. When the element updates and dispatches an event, the *value* property will be used as the new, bound signal value. When the signal updates independent of the element, the *value* property will be set to the signal value and a new event will be dispatched on the element. |
| event               | {% include type t="String" %}  | The event (default `"input"`) to listen for to track changes on the external element. |
| debounce            | {% include type t="Number" %}  | If defined, delays event handling until the specified milliseconds have elapsed since the last event was fired.|
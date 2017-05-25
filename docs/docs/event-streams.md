---
layout: spec
title: Event Streams
permalink: /docs/event-streams/index.html
---

**Event streams** are the primary means of modeling user input to enable dynamic, interactive visualizations. Event streams capture a sequence of input events such as mouse click, touch movement, or signal updates. When events that match a stream definition occur, they cause any corresponding [signal event handlers](../signals/#handlers) to evalute, potentially updating a signal value.

{: .suppress-error}
```json
{
  "name": "signalName",
  "on": [
    {
      "events": <<event-stream-definition>>,
      "update": ...
    }
  ]
}
```

An event stream definition can be specified in multiple ways:

- [Event stream objects](#object) indicate which events to capture.
- [Event stream selectors](#selector) string provide a convenient shorthand for event stream objects. For example, `"rect:mouseover"` or `"click[event.shiftKey]"`.
- [Signal references](#signal) capture signal updates. For example, `{"signal": "name"}`.
- An array of multiple [event stream objects](#object) and/or [signal references](#signal) to capture.


## <a name="types"></a>Supported Event Types

The supported DOM event types for mark items are:

- [`click`](https://developer.mozilla.org/en-US/docs/Web/Events/click)
- [`dblclick`](https://developer.mozilla.org/en-US/docs/Web/Events/dblclick)
- [`dragenter`](https://developer.mozilla.org/en-US/docs/Web/Events/dragenter)
- [`dragleave`](https://developer.mozilla.org/en-US/docs/Web/Events/dragleave)
- [`dragover`](https://developer.mozilla.org/en-US/docs/Web/Events/dragover)
- [`keydown`](https://developer.mozilla.org/en-US/docs/Web/Events/keydown)
- [`keypress`](https://developer.mozilla.org/en-US/docs/Web/Events/keypress)
- [`keyup`](https://developer.mozilla.org/en-US/docs/Web/Events/keyup)
- [`mousedown`](https://developer.mozilla.org/en-US/docs/Web/Events/mousedown)
- [`mousemove`](https://developer.mozilla.org/en-US/docs/Web/Events/mousemove)
- [`mouseout`](https://developer.mozilla.org/en-US/docs/Web/Events/mouseout)
- [`mouseover`](https://developer.mozilla.org/en-US/docs/Web/Events/mouseover)
- [`mouseup`](https://developer.mozilla.org/en-US/docs/Web/Events/mouseup)
- [`mousewheel`](https://developer.mozilla.org/en-US/docs/Web/Events/mousewheel)
- [`touchend`](https://developer.mozilla.org/en-US/docs/Web/Events/touchend)
- [`touchmove`](https://developer.mozilla.org/en-US/docs/Web/Events/touchmove)
- [`touchstart`](https://developer.mozilla.org/en-US/docs/Web/Events/touchstart)
- [`wheel`](https://developer.mozilla.org/en-US/docs/Web/Events/wheel)
{: .column-list}

Other event types supported by the browser (e.g., [`resize`](https://developer.mozilla.org/en-US/docs/Web/Events/resize) events on the window object) may be captured from DOM elements on the same web page as the Vega visualization. The list above applies _only_ to mark items contained within the Vega view's scenegraph.


## <a name="object"></a>Event Stream Objects

A basic event stream consists of an event source and type:

| Property    | Type                          | Description   |
| :---------- | :---------------------------: | :------------ |
| source      | {% include type t="String" %} | The input event source. This defaults to `"view"` to monitor events from the current Vega view component. Other legal values are `"scope"` (indicating only events originating within the group in which the event stream is defined), `"window"` for the browser window object, or a [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) string indicating external DOM elements.|
| type        | {% include type t="String" %} | {% include required %} The event type to monitor (e.g., `"click"`, `"keydown"`). For more, see the [supported event types list](#types).|

Any event stream object may also include the following properties for filtering or modifying an event stream:

| Property    | Type                               | Description   |
| :---------- | :--------------------------------: | :------------ |
| between     | {% include array t="[EventStream](#object)" %} | A two-element array of event stream objects, indicating sentinel starting and ending events. Only events that occur between these two events will be captured.|
| consume     | {% include type t="Boolean" %}     | A boolean flag (default `false`) indicating if this stream should consume the event by invoking [`event.preventDefault()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault). |
| filter      | [Expression](../expressions){% include or %}{% include array t="[Expression](../expressions)" %} | One or more filter expressions, each of which must evaluate to a truthy value in order for the event to be captured. These expressions may **not** reference signal values, only event properties.|
| debounce    | {% include type t="Number" %}      | The minimum time to wait between event occurrence and processing. If a new event arrives during a debouncing window, the debounce timer will restart and only the new event will be captured.|
| markname    | {% include type t="String" %}      | The unique name of a mark set for which to monitor input events. Events originating from other marks will be ignored.|
| marktype    | {% include type t="String" %}      | The type or marks (`arc`, `rect`, _etc._) to monitor for input events. Events originating from other mark types will be ignored.|
| throttle    | {% include type t="Number" %}      | The minimum time in milliseconds between captured events (default `0`). New events that arrive within the throttling window will be ignored.|

For example, to capture click events on `rect` marks:

```json
{"type": "click", "marktype": "rect"}
```

To capture resize events on the browser window:

```json
{"source": "window", "type": "resize"}
```

To capture mousedown events on `image` marks if the control key is pressed and the left mouse button is used:

```json
{
  "type": "mousedown",
  "marktype": "image",
  "filter": ["event.ctrlKey", "event.button === 0"]
}
```

To capture mousemove events that occur between mousedown and mouseup events:

```json
{
  "type": "mousemove",
  "between": [
    {"type": "mousedown"},
    {"type": "mouseup"}
  ]
}
```

### Derived Event Streams

In addition to basic streams, an event stream object can serve as input for a derived event stream.

| Property     | Type                   | Description   |
| :----------- | :--------------------: | :------------ |
| stream       | [EventStream](#object) | {% include required %} An input event stream to modify with additional parameters.|

For example:

```json
{
  "stream": {"marktype": "rect", "type": "click"},
  "filter": "event.shiftKey",
  "debounce": 500
}
```

### Merged Event Streams

A set of event streams can also be merged together.

| Property     | Type                                           | Description   |
| :----------- | :--------------------------------------------: | :------------ |
| merge        | {% include array t="[EventStream](#object)" %} | {% include required %} An array of event streams to merge into a single stream.|

For example:

```json
{
  "merge": [
    {"marktype": "symbol", "type": "mousedown"},
    {"marktype": "symbol", "type": "touchstart"}
  ]
}
```


## <a name="selector"></a>Event Stream Selectors

An event selector is a convenient shorthand, inspired by [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors), for defining an event stream of interest.

### Basic Selectors

A basic selector specifies an event _type_, an optional event _source_, and optional _filter_ expressions.

The general form of a basic selector (using a regexp-style syntax) is:

`(source:)?type([filter])*({throttle(,debounce)?})?`

The _source_ property supports the following options:

- If undefined, all marks and the view itself will be monitored, equivalent to an event object with _source_ property `"view"`.
- A valid [mark type](../marks). For example, `arc`, `image`, or `rect`.
- A mark name preprended by `@`. For example, `@cell`. Matching items must have the _name_ property specified in their [mark definition](../marks).
- The string `*`, indicating any mark type, but not the view component itself.
- The string `window`, indicating the [browser window object](https://developer.mozilla.org/en-US/docs/Web/API/Window).
- If none of the above, _source_ will be interpreted as a [CSS selector string](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) indicating DOM elements to monitor.

The _type_ property must be a [supported DOM event type](#types). To indicate that an event should be consumed (_i.e._, that [`event.preventDefault()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) is called), include an exclamation point (`!`) at the end of the event type.

One or more _filter_ expressions can be included as bracket-delimited (`[]`) [expressions](../expressions). If multiple filters are provided, they will be combined into a single filter via boolean "and". Filter expressions may **not** make reference to any signals, only to the event object itself.

To _throttle_ or _debounce_ an event stream, add timing information in milliseconds within curly braces (`{}`) at the end of a selector.

Here are some examples of basic event selectors:

```
mousedown           // capture all mousedown events, regardless of source
*:mousedown         // mousedown events on marks, but not the view itself
rect:mousedown      // mousedown events on any rect marks
@foo:mousedown      // mousedown events on marks named 'foo'
symbol:mousedown!   // capture and consume mousedown events on symbol marks
window:mousemove    // capture mousemove events from the browser window
mousemove{100}      // throttle the stream by 100 ms
mousemove{100, 200} // also debounce the stream by 200 ms
mousemove{0, 200}   // debounce by 200 ms, but do not throttle
mousemove[event.buttons] // mousemove events with any mouse button pressed
click[event.shiftKey]    // click events with the shift key pressed
```

### Merge Selectors

To merge event streams, simply use multiple selectors separated by commas.

`selector1, selector2, ...`

For example, to capture both mousedown and touchstart events on path marks:

`path:mousedown, path:touchstart`

### Between Filters

To capture events that occur between two other events, use a bracket notation.

`[startSelector, stopSelector] > selector`

Between filters are particularly useful to capture streams of drag events:

`[rect:mousedown, window:mouseup] > window:mousemove`

This example initiates a drag upon mousedown on a `rect` mark, then tracks the drag using events on the browser window. Using the window as the event source lets the drag continue if the mouse pointer leaves the initial rect mark or the view component.


## <a name="signal"></a>Signal References

Event stream definitions can also be simple [signal references](../types/#Signal):

{: .suppress-error}
```json
"on": [
  {
    "events": {"signal": "foo"},
    "update": "..."
  }
]
```

In this case, an update will be triggered whenever the signal `foo` changes. Signal references can be combined with event stream objects by providing an array to the _events_ property:

{: .suppress-error}
```json
"on": [
  {
    "events": [{"signal": "foo"}, {"type": "click", "marktype": "rect"}],
    "update": "..."
  }
]
```
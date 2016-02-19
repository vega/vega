# vega-event-selectors
A CSS-inspired language to select, sequence, and compose DOM events into "streams". The following syntax is supported:

* `eventType` -- captures event of a specific type, for example `mousedown` or `touchmove`. By default, this captures all events of the given type, that occur anywhere on the visualization.

* `target:eventType` -- only captures events that occur on the given target. The following targets are recognized:

  * `markType` -- only captures events that occur on any mark instance of the given type. For example `rect:mousedown` captures all `mousedown` events that occur on rect marks. Supported mark types include `rect`, `symbol`, `path`, `arc`, `area`, `line`, `rule`, `image`, and `text`.

  * `@markName` -- only captures events that occur on mark instances with the given name. For example, `@cell:mousemove` captures all `mousemove` events that occur on instances of the mark named `cell`.

  * `CSS selector` -- the full gamut of CSS selectors can be used to capture events on elements that exist outside the visualization. For example, `#header:mousemove` captures `mouseover` events that occur on the HTML element with ID `header`.

* `eventStream[filterExpr]` -- filters for events in the stream that match the given expression. The filter expression should be specified using the [Vega Expression](https://github.com/vega/vega/wiki/Expressions) subset of the JavaScript syntax. Multiple expressions can also be specified through concatenation. For example, `mousedown[event.pageX > 5][event.pageY < 100] captures `mousedown` events which occur at least 5px horizontally, and no more than 100px vertically on the page.

* `streamA, streamB` -- merges individual event streams into a single stream, with the constituent events interleaved correctly. For example, `@cell:mousemove, mousedown[event.pageX > 5]` produces a single stream of `@cell:mousedown` and `mousedown[event.pageX > 5]` events, interleaved as they occur.

* `[streamA, streamB] > streamC` -- captures `streamC` events that occur between `streamA` and `streamB`. For example, `[mousedown, mouseup] > mousemove` captures `mousemove` events that occur between a `mousedown` and `mouseup` (i.e., a stream of "drag" events).

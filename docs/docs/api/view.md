---
layout: api
title: View API
permalink: /docs/api/view/index.html
---

A **View** instantiates a Vega dataflow graph and provides a component for visualization rendering and interaction. When initialized with a container DOM element, the View adds a Canvas or SVG-based visualization to a web page. Alternatively, a View can be used either client-side or server-side to export static SVG or PNG (Canvas) images.

## <a name="reference"></a>View API Reference

- [View Construction](#view-construction)
- [View Configuration](#view-configuration)
- [Dataflow and Rendering](#dataflow-and-rendering)
- [Signals](#signals)
- [Event Handling](#event-handling)
- [Image Export](#image-export)
- [Data and Scales](#data-and-scales)

## <a name="view-construction"></a>View Construction

Methods for constructing and deconstructing views. In addition to the methods described below, View instances also inherit all (non-overridden) methods of the [Dataflow](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/Dataflow.js) parent class.

<a name="view" href="#view">#</a>
vega.<b>View</b>(<i>runtime</i>[, <i>options</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Constructor that creates a new View instance for the provided [Vega dataflow *runtime* specification](https://github.com/vega/vega/blob/master/packages/vega-runtime/). If provided, the *options* argument should be an object with one or more of the following properties:

- *background*: View background color. See the [background](#view_background) method.
- *bind*: DOM container element (or CSS selector) for input elements bound to signals. See the [initialize](#view_initialize) method.
- *container*: Parent DOM container element (or unique CSS selector) for this view. See the [initialize](#view_initialize) method.
- *hover*: Boolean flag indicating if hover processing should be enabled. See the [hover](#view_hover) method.
- *loader*: Default [loader](https://github.com/vega/vega/blob/master/packages/vega-loader/#loader) instance to use for data files and images.
- *logLevel*: Initial log level to use. See the [logLevel](#view_logLevel) method.
- *logger*: Initial logger to use. See the [logger](#view_logger) method.
- *renderer*: The type of renderer to use (`'canvas'` or `'svg'`). See the [renderer](#view_renderer) method.
- *tooltip*: Handler function invoked to support tooltip display. See the [tooltip](#view_tooltip) method.
- *locale*: Locale definitions for string parsing and formatting of number and date values. The locale object should contain `number` and/or `time` properties with [locale definitions](../locale). If unspecified, the current default locale at the time of instantiation will be used for the View instance. <small>{% include tag ver="5.12" %}</small>
- *expr*: Alternate evaluator for Vega expressions. See the [interpreter](../../../usage/interpreter) usage documentation. <small>{% include tag ver="5.13" %}</small>

The View constructor call is typically followed by a chain of method calls to setup the desired view configuration. After this chain, the [runAsync](#view_runAsync) method evaluates the underlying dataflow graph to update and render the visualization.

```js
var view = new vega.View(runtime)
  .logLevel(vega.Warn) // set view logging level
  .renderer('svg')     // set render type (defaults to 'canvas')
  .initialize('#view') // set parent DOM element
  .hover();            // enable hover event processing, *only call once*!

view.runAsync(); // evaluate and render the view
```

Alternatively, using View constructor options:

```js
var view = new vega.View(runtime, {
    logLevel:  vega.Warn, // view logging level
    renderer:  'svg',     // render type (defaults to 'canvas')
    container: '#view',   // parent DOM element
    hover:     true       // enable hover event processing
  });

view.runAsync(); // evaluate and render the view
```

Or, if used within an [`async` function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function):

```js
var view = await new vega.View(runtime, {
    logLevel:  vega.Warn, // view logging level
    renderer:  'svg',     // render type (defaults to 'canvas')
    container: '#view',   // parent DOM element
    hover:     true       // enable hover event processing
  }).runAsync();          // evaluate and render the view
```

<a name="view_finalize" href="#view_finalize">#</a>
view.<b>finalize</b>()
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/finalize.js "Source")

Prepares the view to be removed. To prevent unwanted behaviors and memory leaks, this method unregisters any timers and removes any event listeners the visualization has registered on external DOM elements. Applications should invoke this method when a View instance is no longer needed.

[Back to reference](#reference)


## <a name="view-configuration"></a>View Configuration

Methods for configuring the view state. These methods are often (but not always) invoked immediately after the View constructor, *prior* to the first invocation of the [runAsync](#view_runAsync) or [run](#view_run) methods.

<a name="view_initialize" href="#view_initialize">#</a>
view.<b>initialize</b>([<i>container</i>, <i>bindContainer</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/initialize.js "Source")

Initializes internal rendering and event handling, then returns this view instance. If the DOM element *container* is provided, visualization elements (such as Canvas or SVG HTML elements) will be added to the web page under this containing element. If *container* is not provided, the view will operate in *headless* mode, and can still generate static visualization images using the [image export](#image-export) methods. The optional DOM element (or unique CSS selector) *bindContainer* indicates the element that should contain any input elements bound to signals; if not specified the same container element as the visualization will be used.

<a name="view_loader" href="#view_loader">#</a>
view.<b>loader</b>([<i>loader</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Get or set the [loader](https://github.com/vega/vega/blob/master/packages/vega-loader/#loader) instance to use for data files and images. If the loader is updated _after_ [initialize](#view_initialize) has been invoked, the visualization will be reinitialized. If a Vega View loads data from an external URL, the load request is made _immediately_ upon view construction. To ensure a custom loader is used, _provide the loader as a constructor option!_ Invoking this method will update the loader only _after_ initial data requests have been made. This method will reset the renderer; invoke [`runAsync`](#view_runAsync) after calling this method to ensure the view is redrawn.

<a name="view_logLevel" href="#view_logLevel">#</a>
view.<b>logLevel</b>(<i>level</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/Dataflow.js "Source")

Sets the current log level and returns this view instance. This method controls which types of log messages are printed to the JavaScript console, and is inherited from the [Dataflow](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/Dataflow.js) parent class. The valid *level* values are `vega.None` (the default), `vega.Warn`, `vega.Info`, `vega.Debug`. See the [logger](https://github.com/vega/vega/blob/master/packages/vega-util/#logger) method in [vega-util](https://github.com/vega/vega/blob/master/packages/vega-util/) for more.

<a name="view_logger" href="#view_logger">#</a>
view.<b>logger</b>(<i>logger</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/Dataflow.js "Source")

Get or set the logger instance used to log messages. If no arguments are provided, returns the current logger instance. Otherwise, sets the logger and return this View instance. Provided loggers must support the full API of logger objects generated by the [vega-util](https://github.com/vega/vega/blob/master/packages/vega-util/) [logger](https://github.com/vega/vega/blob/master/packages/vega-util/#logger) method. Note that by default the log level of the new logger will be used; use the [logLevel](#view_logLevel) method to adjust the log level as needed.

When providing a custom logger instance, be aware that all logger methods will be invoked with the View as the [function `this` context](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this). This allows loggers to query additional View state (such as the current pulse timestamp) if desired. Custom loggers that reference their own internal state should avoid using `this`, unless those methods are defined using [arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).

<a name="view_renderer" href="#view_renderer">#</a>
view.<b>renderer</b>(<i>type</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Sets the renderer *type* (e.g., `'canvas'` (the default) or `'svg'`) and returns this view instance. While typically invoked immediately upon view creation, this method can be called at any time to change the renderer. Invoke [`runAsync`](#view_runAsync) after calling this method to ensure the view is redrawn.

Additional renderer types may be used if registered via the [renderModule](https://github.com/vega/vega/blob/master/packages/vega-scenegraph/src/modules.js) method exported by [vega-scenegraph](https://github.com/vega/vega/blob/master/packages/vega-scenegraph/); for an example see the [vega-webgl-renderer](https://github.com/vega/vega-webgl-renderer).

<a name="view_tooltip" href="#view_tooltip">#</a>
view.<b>tooltip</b>(<i>tooltipHandler</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Get or set the tooltip handler function, which is invoked to handle display of tooltips (for example, when users hover the mouse cursor over an item). This method will reset the renderer; invoke [`runAsync`](#view_runAsync) after calling this method to ensure the view is redrawn. The *tooltipHandler* argument should be a function that respects the following method signature:

```js
function(handler, event, item, value) {
  // perform custom tooltip presentation
}
```

The *tooltipHandler* function arguments are:

- *handler* - The scenegraph input [Handler](https://github.com/vega/vega/blob/master/packages/vega-scenegraph/src/Handler.js) instance that invoked the *tooltipHandler* function.
- *event* - The [event](https://developer.mozilla.org/en-US/docs/Web/Events) that caused an update to the tooltip display.
- *item* - The scenegraph item corresponding to the tooltip.
- *value* - The tooltip value to display. If `null` or `undefined`, indicates that no tooltip should be shown. The tooltip *value* may have an arbitrary type, including Object and Array values. It is up the *tooltipHandler* to appropriately interpret and display this value.
- In addition, Vega invokes the *tooltipHandler* using the current View as the *this* context for the function.

The default handler uses built-in browser support to show tooltips. It takes a value to show in a tooltip, transforms it to a string value, and sets the HTML `"title"` attribute on the element containing the View. The default handler will coerce literal values to strings, and will show the contents of Object or Array values (up to one level of depth). For Object values, each key-value pair is displayed on its own line of text (`"key1: value\nkey2: value2"`).

<a name="view_hover" href="#view_hover">#</a>
view.<b>hover</b>([<i>hoverSet</i>, <i>updateSet</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/hover.js "Source")

Enables hover event processing and returns this view instance. The optional arguments specify which named encoding sets to invoke upon mouseover and mouseout. The *hoverSet* defaults to `'hover'`, corresponding to the `"hover"` set within a Vega mark specification `"encode"` block. The *updateSet* defaults to `'update'`, corresponding to the `"update"` set within a Vega mark specification `"encode"` block. If this method is never invoked, the view will not automatically handle hover events. Instead, the underlying dataflow definition will have to explicitly set up event streams for handling mouseover and mouseout events.

*This method should be invoked only once, upon view initialization.* Calling this method multiple times will add redundant event listeners to the view. In other words, this method is **not** [idempotent](https://en.wikipedia.org/wiki/Idempotence).

<a name="view_description" href="#view_description">#</a>
view.<b>description</b>([<i>text</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source") {% include tag ver="5.10" %}

Gets or sets descriptive *text* for this view. This description determines the [`aria-label` attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute) for the view's container element. If no arguments are provided, returns the current description. If *text* is specified, this method sets the description and updates the view container element.

<a name="view_background" href="#view_background">#</a>
view.<b>background</b>([<i>color</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Gets or sets the view background color. If no arguments are provided, returns the current background color. If *color* is specified, this method sets the background color (overriding any background color defined in the input Vega specification) and returns this view instance. This method does not force an immediate update to the view: invoke the [runAsync](#view_runAsync) method when ready. This method is equivalent to `view.signal('background'[, color])`.

<a name="view_width" href="#view_width">#</a>
view.<b>width</b>([<i>width</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Gets or sets the view width, in pixels. If no arguments are provided, returns the current width value. If *width* is specified, this method sets the width and returns this view instance. This method does not force an immediate update to the view: invoke the [runAsync](#view_runAsync) method when ready. This method is equivalent to `view.signal('width'[, width])`.

<a name="view_height" href="#view_height">#</a>
view.<b>height</b>([<i>height</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Gets or sets the view height, in pixels. If no arguments are provided, returns the current height value. If *height* is specified, this method sets the height and returns this view instance. This method does not force an immediate update to the view: invoke the [runAsync](#view_runAsync) method when ready. This method is equivalent to `view.signal('height'[, height])`.

<a name="view_padding" href="#view_padding">#</a>
view.<b>padding</b>([<i>padding</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Gets or sets the view padding, in pixels. Input *padding* objects take the form `{left: 5, top: 5, right: 5, bottom: 5}`; if a numeric *padding* value is provided, it will be expanded to an object with all properties set to that number. If no arguments are provided, returns the current padding value. If *padding* is specified, this method sets the padding and returns this view instance. This method does not force an immediate update to the view: invoke the [runAsync](#view_runAsync) method when ready. This method is equivalent to `view.signal('padding'[, padding])`.

<a name="view_resize" href="#view_resize">#</a>
view.<b>resize</b>()
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Sets a flag indicating that layout autosize calculations should be re-run on the next pulse propagation cycle. If an autosize method of `"pad"` or `"fit"` is being used, calling this method will cause the chart bounds layout to be recomputed the next time the [runAsync](#view_runAsync) method is invoked.

[Back to reference](#reference)


## <a name="dataflow-and-rendering"></a>Dataflow and Rendering

Methods for invoking dataflow evaluation and view rendering.

<a name="view_runAsync" href="#view_runAsync">#</a>
view.<b>runAsync</b>([<i>encode</i>, <i>prerun</i>, <i>postrun</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Evaluates the underlying dataflow graph and returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that resolves upon completion of dataflow processing and scengraph rendering. The optional *encode* argument is a String value indicating the name of a custom `"encode"` set to run in addition to the standard `"update"` encoder. Any scenegraph elements modified during dataflow evaluation will automatically be re-rendered in the view.

Internally, this method invokes evaluation by the [Dataflow](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/Dataflow.js) parent class, and then additionally performs rendering. The returned [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) will resolve after rendering operations are complete. This method should not be invoked repeatedly until a prior call resolves: callers should `await` the result of runAsync (or use `.then(...)` chaining) before re-invoking the method.

The optional *prerun* and *postrun* functions are callbacks that will be invoked immediately before and after dataflow evaluation and rendering. The callback functions are called with this view instance as the sole argument. The callbacks may be [async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). If provided, *postrun* will be invoked *after* any callbacks registered via the [runAfter](#view_runAfter) method.

*Most clients should not use the prerun and postrun callback arguments*. The callbacks are provided to support internal Vega operations. To perform post-processing after dataflow evaluation, in most cases clients should invoke [then](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) or [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) returned by [runAsync](#view_runAsync).

<a name="view_run" href="#view_run">#</a>
view.<b>run</b>([<i>encode</i>, <i>prerun</i>, <i>postrun</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/run.js "Source")

Requests asynchronous view evaluation and then synchronously returns this view instance without waiting for evaluation to complete. The arguments are identical to those for [runAsync](#view_runAsync).

This method will return prior to completion of dataflow evaluation. To perform actions after dataflow evaluation is finished, instead use [runAsync](#view_runAsync) and invoke [then](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) or [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) on the returned [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

<a name="view_runAfter" href="#view_runAfter">#</a>
view.<b>runAfter</b>(<i>callback</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/run.js "Source")

Schedules a *callback* function to be invoked after the current dataflow evaluation completes. The callback function will be called with this view instance as the sole argument. The callback may be an [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

If dataflow evaluation is not currently occurring, the callback function is invoked immediately. This method is used internally to schedule follow-up operations within the dataflow runtime engine. *Most clients should not use this method*; instead call [runAsync](#view_runAsync) and perform follow-up operations when the returned Promise resolves.

<a name="view_dirty" href="#view_dirty">#</a>
view.<b>dirty</b>(<i>item</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Reports a "dirty" scenegraph item to be re-drawn the next time dataflow evaluation completes. This method is typically invoked by dataflow operators directly to populate a dirty list for incremental rendering.

<a name="view_container" href="#view_container">#</a>
view.<b>container</b>()
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Returns the DOM container element for this view, if it exists.

<a name="view_scenegraph" href="#view_scenegraph">#</a>
view.<b>scenegraph</b>()
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Returns the [Vega scenegraph](https://github.com/vega/vega/tree/master/packages/vega-scenegraph) instance for this view.

<a name="view_origin" href="#view_origin">#</a>
view.<b>origin</b>()
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Returns the *[x, y]* origin coordinates for the current view. The origin coordinates indicate the translation of the view's primary coordinate system, encompassing the left and top padding values as well as any additional padding due to autosize calculations.

[Back to reference](#reference)


## <a name="signals"></a>Signals

Methods for accessing and updating dataflow *signal* values.

<a name="view_signal" href="#view_signal">#</a>
view.<b>signal</b>(<i>name</i>[, <i>value</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Gets or sets a dataflow *signal*. If only the *name* argument is provided, returns the requested signal value. If *value* is also specified, updates the signal and returns this view instance. If the signal does not exist, an error will be raised. This method does not force an immediate update to the view: invoke the [runAsync](#view_runAsync) method when ready.

<a name="view_getState" href="#view_getState">#</a>
view.<b>getState</b>([<i>options</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/state.js "Source")

Gets the state of signals and data sets in this view's backing dataflow graph. If no arguments are specified, returns an object containing both signal values and any modified data sets for this view. By default, the exported state includes all signal values (across all mark contexts) except for those bound to data pipeline transforms, and any data sets that were explicitly modified via triggers or the View API.

An *options* argument can be provided to control what internal state is collected. However, the options involve interacting with internal details of a Vega runtime dataflow and is intended for expert use only. The default options should suffice for state capture in most instances.

The *options* object supports the following properties:
- *signals*: A predicate function that accepts a signal *name* and *operator* and returns true to export the operator state.
- *data*: A predicate function that accepts a dataset *name* and *dataset* object and returns true to export the data.
- *recurse*: A boolean flag indicating if the state export process should recurse into mark sub-contexts.

<a name="view_setState" href="#view_setState">#</a>
view.<b>setState</b>(<i>state</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/state.js "Source")

Sets the *state* of signals and/or datasets in this view's backing dataflow graph. The *state* argument should be an object generated by the [getState](#view_getState) method. This method updates all implicated signals and data sets, invokes the [run](#view_run) method, and returns this view instance.

<a name="view_addSignalListener" href="#view_addSignalListener">#</a>
view.<b>addSignalListener</b>(<i>name</i>, <i>handler</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Registers a listener for changes to the signal with the given *name* and returns this view instance. If the signal does not exist, an error will be raised. This method is idempotent: adding the same handler for the same signal multiple times has no effect beyond the first call.

When the signal value changes, the *handler* function is invoked with two arguments: the *name* of the signal and the new signal *value*. Listeners will be invoked when the signal value *changes* during pulse propagation (e.g., after [runAsync](#view_runAsync) is called, but before its returned Promise resolves).

Signal listeners are invoked immediately upon signal update, in the midst of dataflow evaluation. As a result, other signal updates and data transforms may have yet to update. If you wish to access the values of other signals, or update signal values and re-run the dataflow, use the [runAsync](#view_runAsync) method with a *prerun* callback that performs the desired actions _after_ the current dataflow evaluation completes, but before the requested re-run begins. Attempting to call the synchronous [run](#view_run) method from within a signal listener will result in an error, as recursive invocation is not allowed.

To remove a listener, use the [removeSignalListener](#view_removeSignalListener) method.

```js
view.addSignalListener('width', function(name, value) {
  console.log('WIDTH: ' + value);
});
view.width(500).run(); // listener logs 'WIDTH: 500'
```

<a name="view_removeSignalListener" href="#view_removeSignalListener">#</a>
view.<b>removeSignalListener</b>(<i>name</i>, <i>handler</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Removes a signal listener registered with the [addSignalListener](#view_addSignalListener) method and returns this view instance. If the signal does not exist, an error will be raised. If the signal exists but the provided *handler* is not registered, this method has no effect.

[Back to reference](#reference)


## <a name="event-handling"></a>Event Handling

Methods for generating new event streams, registering event listeners, and handling tooltips. See also the [hover](#view_hover) method.

<a name="view_events" href="#view_events">#</a>
view.<b>events</b>(<i>source</i>, <i>type</i>[, <i>filter</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/events.js "Source")

Returns a new [EventStream](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/EventStream.js) for a specified *source*, event *type*, and optional *filter* function. The *source* should be one of `"view"` (to specify the current view), `"window"` (to specify the browser window object), or a valid CSS selector string (that will be passed to `document.querySelectorAll`). The event *type* should be a legal DOM event type. If provided, the optional *filter* argument should be a function that takes an event object as input and returns true if it should be included in the produced event stream.

Typically this method is invoked internally to create event streams referenced within Vega signal definitions. However, callers can use this method to create custom event streams if desired. This method assumes that the view is running in a browser environment, otherwise invoking this method may have no effect.

<a name="view_addEventListener" href="#view_addEventListener">#</a>
view.<b>addEventListener</b>(<i>type</i>, <i>handler</i>[, <i>options</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Registers an event listener for input events and returns this view instance. The event *type* should be a string indicating a legal DOM event type supported by [vega-scenegraph](https://github.com/vega/vega/blob/master/packages/vega-scenegraph/) event handlers. Examples include `"mouseover"`, `"click"`, `"keydown"` and `"touchstart"`. This method is idempotent: adding the same handler for the same event type multiple times has no effect beyond the first call.

The optional _options_ hash accepts one parameter (_options.trap_): if _options.trap_ is set to `false`, automatic error trapping for event handler functions is disabled.

When events occur, the *handler* function is invoked with two arguments: the *event* instance and the currently active scenegraph *item* (which is `null` if the event target is the view component itself).

All registered event handlers are preserved upon changes of renderer. For example, if the View [renderer](#view_renderer) type is changed from `"canvas"` to `"svg"`, all listeners will remain active. To remove a listener, use the [removeEventListener](#view_removeEventListener) method.

```js
view.addEventListener('click', function(event, item) {
  console.log('CLICK', event, item);
});
```

<a name="view_removeEventListener" href="#view_removeEventListener">#</a>
view.<b>removeEventListener</b>(<i>type</i>, <i>handler</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Removes an event listener registered with the [addEventListener](#view_addEventListener) method and returns this view instance.

<a name="view_addResizeListener" href="#view_addResizeListener">#</a>
view.<b>addResizeListener</b>(<i>handler</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Registers a listener for changes to the view size and returns this view instance. This method is idempotent: adding the same handler multiple times has no effect beyond the first call.

When the view size changes, the *handler* function is invoked with two arguments: the *width* and *height* of the view.

```js
view.addResizeListener(function(width, height) {
  console.log('RESIZE', width, height);
});
```

<a name="view_removeResizeListener" href="#view_removeResizeListener">#</a>
view.<b>removeResizeListener</b>(<i>handler</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Removes a listener registered with the [addResizeListener](#view_addResizeListener) method and returns this view instance.

<a name="view_globalCursor" href="#view_globalCursor">#</a>
view.<b>globalCursor</b>(<i>flag</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source") {% include tag ver="5.13" %}

Gets or sets a boolean *flag* (default `false`) value indicating if Vega should adjust the cursor for the current document body (`true`) or within the Vega View component only (`false`). Values set via this method will override the cursor configuration provided by a Vega specification.

<a name="view_preventDefault" href="#view_preventDefault">#</a>
view.<b>preventDefault</b>(<i>flag</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Gets or sets a boolean *flag* value (default `false`) indicating if Vega should call `preventDefault()` on input events by default. This method specifies the default behavior only, and is overridden by input event configuration provided to the specification or parser.

[Back to reference](#reference)


## <a name="image-export"></a>Image Export

Methods for exporting static visualization images. These methods can be invoked either client-side or server-side.

<a name="view_toCanvas" href="#view_toCanvas">#</a>
view.<b>toCanvas</b>([<i>scaleFactor</i>, <i>options</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/render-to-canvas.js "Source")

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that resolves to a canvas instance containing a rendered bitmap image of the view. The optional *scaleFactor* argument (default 1) is a number by which to multiply the view width and height when determining the output image size. If invoked in a browser, the returned Promise resolves to an [HTML5 canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas) element. If invoked server-side in node.js, the Promise resolves to a [node-canvas Canvas](https://github.com/Automattic/node-canvas) instance.

The optional *options* object provides additional parameters for the canvas:

- *type*: Type string passed to the [node-canvas Canvas constructor](https://github.com/Automattic/node-canvas#createcanvas) (for example, to specify `'pdf'` output). This property will be ignored if used in the browser.
- *context*: An object of key-value pairs to assign to the Canvas 2D context object. Useful for setting context parameters, particularly for node-canvas.
- *externalContext*: An external [Context2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) instance to render into. If an external canvas is provided, the Promise returned by *toCanvas* will resolve to null. As Vega makes changes to the rendering context state, callers should invoke *context.save()* prior to *toCanvas()*, and invoke *context.restore()* to restore the state after the returned Promise resolves. <small>{% include tag ver="5.12" %}</small>

<a name="view_toSVG" href="#view_toSVG">#</a>
view.<b>toSVG</b>([<i>scaleFactor</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/render-to-svg.js "Source")

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that resolves to an SVG string, providing a vector graphics image of the view. The optional *scaleFactor* argument (default 1) is a number by which to multiply the view width and height when determining the output image size.

<a name="view_toImageURL" href="#view_toImageURL">#</a>
view.<b>toImageURL</b>(<i>type</i>[, <i>scaleFactor</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/render-to-image-url.js "Source")

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that resolves to an image URL for a snapshot of the current view. The *type* argument must be one of `'svg'`, `'png'` or `'canvas'`. Both the png and canvas types result in a PNG image. The generated URL can be used to create downloadable visualization images. The optional *scaleFactor* argument (default 1) is a number by which to multiply the view width and height when determining the output image size.

```js
// generate a PNG snapshot and then download the image
view.toImageURL('png').then(function(url) {
  var link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('target', '_blank');
  link.setAttribute('download', 'vega-export.png');
  link.dispatchEvent(new MouseEvent('click'));
}).catch(function(error) { /* error handling */ });
```

[Back to reference](#reference)

## <a name="data-and-scales"></a>Data and Scales

Methods for accessing *scales* or *data* sets, and performing streaming updates.

<a name="view_scale" href="#view_scale">#</a>
view.<b>scale</b>(<i>name</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/scale.js "Source")

Returns the [scale](https://github.com/vega/vega/blob/master/packages/vega-scale/) or
[projection](https://github.com/vega/vega/blob/master/packages/vega-projection/) instance with the given *name*. The return value is a *live* instance used by the underlying dataflow. Callers should take care not to modify the returned instance!

<a name="view_data" href="#view_data">#</a>
view.<b>data</b>(<i>name</i>[, <i>values</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/data.js "Source")

If only one argument is provided, returns the data set with the given *name*. The returned array of data objects is a *live* array used by the underlying dataflow. Callers that wish to modify the returned array should first make a defensive copy, for example using `view.data('name').slice()`.

{% include tag ver="5.5" %} If two arguments are provided, removes the current data and inserts the input *values*, which can be either a single data object or an array of data objects. This call is equivalent to:

```js
view.change(vega.changeset().remove(vega.truthy).insert(values));
```

Data updates do not force an immediate update to the view: invoke the [runAsync](#view_runAsync) method when ready. Note also that a single argument (getter) call returns the *output* of the data transform pipeline, whereas the two argument (setter) call sets the *input* to the transform pipeline.

<a name="view_addDataListener" href="#view_addDataListener">#</a>
view.<b>addDataListener</b>(<i>name</i>, <i>handler</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Registers a listener for changes to a named data set with the given *name* and returns this view instance. If the data set does not exist, an error will be raised. This method is idempotent: adding the same handler for the same data set multiple times has no effect beyond the first call.

When the data set value changes, the *handler* function is invoked with two arguments: the *name* of the signal and the new data set *value*. Listeners will be invoked when the data set value *changes* during pulse propagation (e.g., after [runAsync](#view_runAsync) is called, but before its returned Promise resolves). The value passed to the handler is the same as that returned by the [view.data](#view_data) method. The returned array of data objects is a *live* array used by the underlying dataflow. Listeners that wish to modify the returned array should first make a defensive copy, for example using `value.slice()`.

Data listeners are invoked immediately upon data set update, in the midst of dataflow evaluation. As a result, other signal values and data transforms may have yet to update. If you wish to access the values of other signals, or update signal values and re-run the dataflow, use the [runAsync](#view_runAsync) method with a *prerun* callback that performs the desired actions _after_ the current dataflow evaluation completes, but before the requested re-run begins. Attempting to call the synchronous [run](#view_run) method from within a signal listener will result in an error, as recursive invocation is not allowed.

To remove a listener, use the [removeDataListener](#view_removeDataListener) method.

```js
view.addDataListener('source', function(name, value) {
  console.log(name, value);
});
```

<a name="view_removeDataListener" href="#view_removeDataListener">#</a>
view.<b>removeDataListener</b>(<i>name</i>, <i>handler</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/View.js "Source")

Removes a data set listener registered with the [addDataListener](#view_addDataListener) method and returns this view instance. If the data set does not exist, an error will be raised. If the data set exists but the provided *handler* is not registered, this method has no effect.

<a name="view_change" href="#view_change">#</a>
view.<b>change</b>(<i>name</i>, <i>changeset</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/data.js "Source")

Updates the data set with the given *name* with the changes specified by the provided *changeset* instance. This method does not force an immediate update to the view: invoke the [runAsync](#view_runAsync) method when ready. To issue a series of changes, insertions, or deletions, be sure to `await` the results of runAsync before issuing the next change.

```js
view.change('data', vega.changeset().insert([...]).remove([...]))
    .run()
```

The *insert* and *remove* methods of the *changeset* accept a single argument. The supported inputs are identical to the second arguments accepted by the [view.insert](#view_insert) and [view.remove](#view_remove) methods.

Inserted data tuples must be JavaScript objects that have been properly parsed ahead of time. Any data source `"format"` directives in a Vega JSON specification will **not** be applied to tuples added through the View API. Internally, this method takes the provided [ChangeSet](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/ChangeSet.js) and invokes [Dataflow.pulse](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/update.js). See [vega-dataflow](https://github.com/vega/vega/blob/master/packages/vega-dataflow/) for more.

For versions {% include tag ver="5.13" %} a *changeset* also supports an optional `clean` setter that accepts a boolean and indicates if internal garbage collection should be performed by Vega in response to the change (this defaults to `true` if the changeset specifies data should be removed).

<a name="view_insert" href="#view_insert">#</a>
view.<b>insert</b>(<i>name</i>, <i>tuples</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/data.js "Source")

Inserts an array of new data *tuples* into the data set with the given *name*, then returns this view instance. The input *tuples* array should contain one or more data objects that are not already included in the data set. This method does not force an immediate update to the view: invoke the [runAsync](#view_runAsync) method when ready.

_Insert can not be used in combination with the [remove](#view_remove) method on the same pulse; to simultaneously add and remove data use the [change](#view_change) method._ To issue a series of changes, insertions, or deletions, be sure to `await` the results of runAsync before issuing the next change.

Inserted data tuples must be JavaScript objects that have been properly parsed ahead of time. Any data source `"format"` directives in a Vega JSON specification will **not** be applied to tuples added through the View API. Internally, this method creates a [ChangeSet](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/ChangeSet.js) and invokes [Dataflow.pulse](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/update.js). See [vega-dataflow](https://github.com/vega/vega/blob/master/packages/vega-dataflow/) for more.

<a name="view_remove" href="#view_remove">#</a>
view.<b>remove</b>(<i>name</i>, <i>tuples</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-view/src/data.js "Source")

Removes data *tuples* from the data set with the given *name*, then returns this view instance. The *tuples* argument can either be an array of tuples already included in the data set, or a predicate function indicating which tuples should be removed. This method does not force an immediate update to the view: invoke the [runAsync](#view_runAsync) method when ready.

_Remove can not be used in combination with the [insert](#view_insert) method on the same pulse; to simultaneously add and remove data use the [change](#view_change) method._ To issue a series of changes, insertions, or deletions, be sure to `await` the results of runAsync before issuing the next change.

For example, to remove all tuples in the `'table'` data set with a `count` property less than five:

```js
view.remove('table', d => d.count < 5).run();
```

Internally, this method creates a [ChangeSet](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/ChangeSet.js) and invokes [Dataflow.pulse](https://github.com/vega/vega/blob/master/packages/vega-dataflow/src/dataflow/update.js). See [vega-dataflow](https://github.com/vega/vega/blob/master/packages/vega-dataflow) for more.

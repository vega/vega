# vega-view

View component and transforms for Vega visualizations. A **View** instantiates
an underlying dataflow graph and provides a component for rendering and
interacting with a visualization. When initialized with a container DOM
element, the View adds a Canvas or SVG-based visualization to a web page.
Alternatively, a View can be used either client-side or server-side to export
static SVG or PNG (Canvas) images.

## View API Reference

* [View Construction](#view-construction)
* [View Configuration](#view-configuration)
* [Dataflow and Rendering](#dataflow-and-rendering)
* [Event Handling](#event-handling)
* [Image Export](#image-export)
* [Signals](#signals)
* [Data](#data)

### View Construction

Methods for constructing and deconstructing views. In addition to the methods
described below, View instances also inherit all (non-overidden) methods of
the [vega-dataflow](https://github.com/vega/vega-dataflow)
[Dataflow](https://github.com/vega/vega-dataflow/blob/master/src/Dataflow.js)
parent class.

<a name="view" href="#view">#</a>
vega.<b>View</b>(<i>runtime</i>[, <i>options</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Constructor that creates a new View instance for the provided
[Vega dataflow *runtime* specification](https://github.com/vega/vega-runtime).
If provided, the *options* argument should be an object with one or more
of the following properties:

- *loadOptions*: Default options for loading data files or images. See the
[load](https://github.com/vega/vega-loader#load) method.
- *logLevel*: Initial log level to use. See the [logLevel](#view_logLevel)
method.
- *renderer*: The type of renderer to use (`'canvas'` or `'svg'`). See the
[renderer](#view_renderer) method.

The View constructor call is typically followed by a chain of method calls
to setup the desired view configuration. At the end of this chain,
the [run](#view_run) method evaluates the underlying dataflow graph to update
and render the visualization.

```js
var view = new vega.View(runtime)
  .logLevel(vega.Warn) // set view logging level
  .initialize(document.querySelector('#view')) // set parent DOM element
  .renderer('svg') // set render type (defaults to 'canvas')
  .hover() // enable hover event processing
  .run(); // update and render the view

```

<a name="view_finalize" href="#view_finalize">#</a>
view.<b>finalize</b>()
[<>](https://github.com/vega/vega-view/blob/master/src/view/finalize.js "Source")

Prepares the view to be removed from a web page. To prevent unwanted behaviors
and memory leaks, this method removes any event listeners the visualization has
registered on external DOM elements.


### View Configuration

Methods for configuring the view state. These methods are often (but not
always) invoked immediately after the View constructor, prior to the first
invocation of the [run](#view_run) method.

<a name="view_initialize" href="#view_initialize">#</a>
view.<b>initialize</b>([<i>container</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/initialize.js "Source")

Initializes internal rendering and event handling, then returns this view
instance. If the DOM element *container* is provided, visualization
elements (such as Canvas or SVG HTML elements) will be added to the web page
under this containing element. If *container* is not provided, the view
will operate in *headless* mode, and can still generate static visualization
images using the [image export](#image-export) methods.

<a name="view_logLevel" href="#view_logLevel">#</a>
view.<b>logLevel</b>(<i>level</i>)
[<>](https://github.com/vega/vega-dataflow/blob/master/src/Dataflow.js "Source")

Sets the current log level and returns this view instance. This method controls
which types of log messages are printed to the JavaScript console, and is
inherited from the
[Dataflow](https://github.com/vega/vega-dataflow/blob/master/src/Dataflow.js)
parent class. The valid *level* values are `vega.None` (the default),
`vega.Warn`, `vega.Info`, `vega.Debug`. See the
[logger](https://github.com/vega/vega-util/#logger) method in
[vega-util](https://github.com/vega/vega-util) for more.

<a name="view_renderer" href="#view_renderer">#</a>
view.<b>renderer</b>(<i>type</i>)
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Sets the renderer type to one of `'canvas'` (the default) or `'svg'` and
returns this view instance. While typically invoked immediately upon view
creation, this method can be called at any time to change the type of renderer
used.

<a name="view_hover" href="#view_hover">#</a>
view.<b>hover</b>([<i>hoverSet</i>, <i>updateSet</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/hover.js "Source")

Enables hover event processing and returns this view instance. The optional
arguments specify which named encoding sets to invoke upon mouseover and
mouseout. The *hoverSet* defaults to `'hover'`, corresponding to the `"hover"`
set within a Vega mark specification `"encode"` block. The *updateSet*
defaults to `'update'`, corresponding to the `"update"` set within a Vega mark
specification `"encode"` block. If this method is never invoked, the view will
not automatically handle hover events. Instead, the underlying dataflow
definition will have to explicitly set up event streams for handling mouseover
and mouseout events.

<a name="view_background" href="#view_background">#</a>
view.<b>background</b>([<i>color</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Gets or sets the view background color. If no arguments are provided, returns
the current background color. If *color* is specified, this method sets the
background color and returns this view instance. This method does not force
an immediate update to the view: invoke the [run](#view_run) method when ready.

<a name="view_width" href="#view_width">#</a>
view.<b>width</b>([<i>width</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Gets or sets the view width, in pixels. If no arguments are provided, returns
the current width value. If *width* is specified, this method sets the width
and returns this view instance. This method does not force an immediate update
to the view: invoke the [run](#view_run) method when ready. This method is
equivalent to `view.signal('width'[, width])`.

<a name="view_height" href="#view_height">#</a>
view.<b>height</b>([<i>height</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Gets or sets the view height, in pixels. If no arguments are provided, returns
the current height value. If *height* is specified, this method sets the
height and returns this view instance. This method does not force an immediate
update to the view: invoke the [run](#view_run) method when ready. This method
is equivalent to `view.signal('height'[, height])`.

<a name="view_padding" href="#view_padding">#</a>
view.<b>padding</b>([<i>padding</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Gets or sets the view padding, in pixels. Padding objects take the form
`{left: 5, top: 5, right: 5, bottom: 5}`. If no arguments are provided, returns
the current padding value. If *padding* is specified, this method sets the
padding and returns this view instance. This method does not force an immediate
update to the view: invoke the [run](#view_run) method when ready. This method
is equivalent to `view.signal('padding'[, padding])`.


### Dataflow and Rendering

Methods for invoking dataflow evaluation and view rendering.

<a name="view_run" href="#view_run">#</a>
view.<b>run</b>([<i>encode</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Evaluates the underlying dataflow graph and returns this view instance. The
optional *encode* argument is a String value indicating the name of a
custom `"encode"` set to run in addition to the standard `"update"` encoder.
If one or more data sets have been queued to be loaded from external files,
this method will function asynchronously: the method will initiate file loading
and return immediately, and the dataflow graph will be evaluated when file
loading completes. Any scenegraph elements modified during dataflow evaluation
will automatically be re-rendered in the view.

Internally, this method invokes the `run` method of the
[Dataflow](https://github.com/vega/vega-dataflow/blob/master/src/Dataflow.js)
parent class, and then additionally performs rendering.

<a name="view_render" href="#view_render">#</a>
view.<b>render</b>([<i>update</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Renders the scenegraph and returns this view instance. If no arguments are
provided, the entire scenegraph is redrawn. If provided, the *update* argument
should be an array of "dirty" scenegraph items to redraw. Incremental rendering
will be perform to redraw only damaged regions of the scenegraph.

During normal execution, this method is automatically invoked by the
[run](#view_run) method. However, clients may explicitly call this method to
(re-)render the scene on demand (for example, to aid debugging).

<a name="view_enqueue" href="#view_enqueue">#</a>
view.<b>enqueue</b>(<i>items</i>)
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Enqueues "dirty" scenegraph items to be re-drawn the next time dataflow
evaluation completes. This method is typically invoked by dataflow operators
directly to populate a dirty list for incremental rendering.

<a name="view_scenegraph" href="#view_scenegraph">#</a>
view.<b>scenegraph</b>()
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Returns the [Vega scenegraph](https://github.com/vega/vega-scenegraph)
instance for this view.


### Event Handling

Methods for generating new event streams. See also the [hover](#view_hover)
method.

<a name="view_events" href="#view_events">#</a>
view.<b>events</b>(<i>source</i>, <i>type</i>[, <i>filter</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/events.js "Source")

Returns a new
[EventStream](https://github.com/vega/vega-dataflow/blob/master/src/EventStream.js)
for a specified *source*, event *type*, and optional *filter* function. The
*source* should be one of `"view"` (to specify the current view), `"window"`
(to specify the browser window object), or a valid CSS selector string
(that will be passed to `document.querySelectorAll`). The event *type* should
be a legal DOM event type. If provided, the option *filter* argument should
be a function that takes an event object as input and returns true if it
should be included in the produced event stream.

Typically this method is invoked internally to create event streams referenced
within Vega signal definitions. However, callers can use this method to create
custom event streams if desired. This method assumes that the view is running
in a browser environment, otherwise invoking this method may have no effect.


### Image Export

Methods for exporting static visualization images. These methods can be invoked
either client-side or server-side.

<a name="view_toCanvas" href="#view_toCanvas">#</a>
view.<b>toCanvas</b>(<i>items</i>)
[<>](https://github.com/vega/vega-view/blob/master/src/view/render-to-canvas.js "Source")

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
that resolves to a canvas instance containing a rendered bitmap image of the
view. If invoked in a browser, the returned Promise resolves to an
[HTML5 canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)
element. If invoked server-side in node.js, the Promise resolves to a
[node-canvas Canvas](https://github.com/Automattic/node-canvas) instance.

<a name="view_toSVG" href="#view_toSVG">#</a>
view.<b>toSVG</b>(<i>items</i>)
[<>](https://github.com/vega/vega-view/blob/master/src/view/render-to-svg.js "Source")

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
that resolves to an SVG string, providing a vector graphics image of the view.

<a name="view_toImageURL" href="#view_toImageURL">#</a>
view.<b>toImageURL</b>(<i>type</i>)
[<>](https://github.com/vega/vega-view/blob/master/src/view/render-to-image-url.js "Source")

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
that resolves to an image URL for a snapshot of the current view. The *type*
argument must be one of `'svg'`, `'png'` or `'canvas'`. Both the png and
canvas types result in a PNG image. The generated URL can be used to create
downloadable visualization images.

```js
// generate a PNG snapshot and then download the image
view.toImageURL('png').then(function(url) {
  var link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('target', '_blank');
  link.setAttribute('download', 'vega-export.png');

  var event = document.createEvent('MouseEvents');
  event.initMouseEvent('click', true, true, document.defaultView,
    1, 0, 0, 0, 0, false, false, false, false, 0, null);
  link.dispatchEvent(event);
}).catch(function(error) { /* error handling */ });
```


### Signals

Methods for accessing and updating dataflow *signal* values.

<a name="view_signal" href="#view_signal">#</a>
view.<b>signal</b>(<i>name</i>[, <i>value</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/View.js "Source")

Gets or sets a dataflow *signal*. If only the *name* argument is provided,
returns the requested signal value. If *value* is also specified, updates the
signal and returns this view instance. This method does not force an immediate
update to the view: invoke the [run](#view_run) method when ready.

<a name="view_state" href="#view_state">#</a>
view.<b>state</b>([<i>state</i>])
[<>](https://github.com/vega/vega-view/blob/master/src/view/state.js "Source")

Gets or sets the state of signals in the dataflow graph. If no arguments are
specified, returns an object of name-value mappings for **all** signals in the
dataflow. If the *state* argument is provided, this method updates the value
of all signals included in the input *state* object, invokes the
[run](#view_run) method, and returns this view instance.


### Data

Methods for accessing *data* sets and performing streaming updates.

<a name="view_data" href="#view_data">#</a>
view.<b>data</b>(<i>name</i>)
[<>](https://github.com/vega/vega-view/blob/master/src/view/data.js "Source")

Returns the data set with the given *name*. The returned array of data
objects is a *live* array used by the underlying dataflow. Callers that wish
to modify the returned array should first make a defensive copy,
for example using `view.data('name').slice()`.

<a name="view_change" href="#view_change">#</a>
view.<b>change</b>(<i>name</i>, <i>changeset</i>)
[<>](https://github.com/vega/vega-view/blob/master/src/view/data.js "Source")

Updates the data set with the given *name* with the changes specified by
the provided *changeset* instance. This method does not force an immediate
update to the view: invoke the [run](#view_run) method when ready.

```js
view.change('data', vega.changeset().insert([...])).remove([...])
    .run()
```

Internally, this method takes the provided
[ChangeSet](https://github.com/vega/vega-dataflow/blob/master/src/ChangeSet.js)
and invokes
[Dataflow.pulse](https://github.com/vega/vega-dataflow/blob/master/src/dataflow/update.js).
See [vega-dataflow](https://github.com/vega/vega-dataflow) for more.

<a name="view_insert" href="#view_insert">#</a>
view.<b>insert</b>(<i>name</i>, <i>tuples</i>)
[<>](https://github.com/vega/vega-view/blob/master/src/view/data.js "Source")

Inserts an array of new data *tuples* into the data set with the given *name*,
then returns this view instance. The input *tuples* array should contain one
or more data objects that are not already included in the data set. This
method does not force an immediate update to the view: invoke the
[run](#view_run) method when ready. Insert can not be used in combination with
the [remove](#view_remove) method on the same pulse; to simultaneously add
and remove data use the [change](#view_change) method.

Internally, this method creates a
[ChangeSet](https://github.com/vega/vega-dataflow/blob/master/src/ChangeSet.js)
and invokes
[Dataflow.pulse](https://github.com/vega/vega-dataflow/blob/master/src/dataflow/update.js).
See [vega-dataflow](https://github.com/vega/vega-dataflow) for more.

<a name="view_remove" href="#view_remove">#</a>
view.<b>remove</b>(<i>name</i>, <i>tuples</i>)
[<>](https://github.com/vega/vega-view/blob/master/src/view/data.js "Source")

Removes data *tuples* from the data set with the given *name*,
then returns this view instance. The *tuples* argument can either be an
array of tuples already included in the data set, or a predicate function
indicating which tuples should be removed. This method does not force an
immediate update to the view: invoke the [run](#view_run) method when ready.
Remove can not be used in combination with the [insert](#view_insert) method
on the same pulse; to simultaneously add and remove data use the
[change](#view_change) method.

For example, to remove all tuples in the `'table'` data set with a `count`
property less than five:
```js
view.remove('table', function(d) { return d.count < 5; }).run();
```

Internally, this method creates a
[ChangeSet](https://github.com/vega/vega-dataflow/blob/master/src/ChangeSet.js)
and invokes
[Dataflow.pulse](https://github.com/vega/vega-dataflow/blob/master/src/dataflow/update.js).
See [vega-dataflow](https://github.com/vega/vega-dataflow) for more.

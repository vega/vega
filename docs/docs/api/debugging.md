---
layout: api
title: Debugging Guide
permalink: /docs/api/debugging/index.html
---

A collection of methods for **debugging** Vega visualizations at runtime. All examples below assume that the [Vega View](../view) instance to debug has been bound to the `view` variable.


## Debugging Methods

- [Inspect Signal Values](#signals)
- [Inspect Data Sets](#data)
- [Snapshot Signal and Data State](#state)
- [Inspect the Scenegraph](#scenegraph)
- [Debugging Expressions](#expressions)
- [Inspect the Runtime Scope](#scope)
{: .column-list}


## <a name="signals"></a>Inspect Signal Values

To inspect signal values, use the [`view.signal`](../view/#view_signal) method:

```js
view.signal('name') // returns the value of the signal 'name'
```

You can also use the same method to set signals due to a desired value. You will still need to invoke `view.run()` to re-run the dataflow after updating any values.

```js
view.signal('name', value).run(); // update signal 'name' and run the dataflow
```

The `view.signal` method will only return signals defined in the top-level of a Vega specification. To view signals defined in nested group marks, create a [state snapshot](#state) or [inspect the runtime scope](#scope).


## <a name="data"></a>Inspect Data Sets

To inspect a data set, use the [`view.data`](../view/#view_data) method:

```js
view.data('name') // return a data object array for the data set 'name'
```

The `view.data` method returns the _output_ of any data transforms applied. To get access to both input and output data, read about [inspecting runtime scope](#scope) below. Also, this method will only return data sets defined in the top-level of a Vega specification. To view data sets defined in nested group marks, create a [state snapshot](#state) or [inspect the runtime scope](#scope).


## <a name="state"><a/>Snapshot Signal and Data State

The [`view.getState`](../view/#view_getState) method returns a snapshot of active signals and data sets, and may be a convenient way to inspect the state of a visualization. The [`view.setState`](../view/#view_setState) method can then be used to restore the state back to a previous value, which may sometimes be useful for testing.

```js
view.getState() // {signals: [...], data: [...], subcontext: [...]}
```

The `view.getState` method returns an object whose properties are a hash of all named `signals` and a hash of all named **input** `data` sets. The `getState` method returns data sets _prior_ to applying transforms, as this is more appropriate for changing the visualization back to a previous state. In addition, if a visualization includes nested group marks with signal or data set definitions, a `subcontext` property is included which contains state information for all nested scopes.


## <a name="scenegraph"></a>Inspect the Scenegraph

It is often helpful to be able to inspect the visual values on scenegraph items, as well as associated data objects. To access the scenegraph from the console, use the [`view.scenegraph`](../view/#view_scenegraph) method and access the scenegraph items starting with the `root` property. Each mark group and scenegraph items can then be accessed under the `items` property.

```js
var root = view.scenegraph().root; // {marktype: "group", items: [...], ...}
```

It can sometimes be tedious to walk down the scenegraph tree manually. Scenegraph items can be accessed in a more direct manipulation way when using the SVG renderer. For example, if using the Chrome browser, first right click an element and select "Inspect" from the menu. The resulting SVG element will be bound to the global variable `$0`. The Vega scenegraph item is then accessible in the console as `$0.__data__`, and the backing data object is `$0.__data__.datum`.


## <a name="expressions"></a>Debugging Expressions

Debugging messages can be added to [expressions](../../expressions) using the logging methods: [`warn`](../../expressions/#warn), [`info`](../../expressions/#info), [`debug`](../../expressions/#debug). The last argument provided to these functions is used as the return value; this allows logging methods to be added to existing expressions without changing the logic of a specification.

To ensure that log messages make their way to the console, the Vega view must have the correct logging level set. For example, to ensure that warning messages are printed to the console:

```js
view.logLevel(vega.Warn);
```


## <a name="scope"></a>Inspect the Runtime Scope

If the above methods prove insufficient, one can also get down and dirty by directly inspecting the internals of the Vega dataflow graph. The dataflow graph consists of a set of _operators_ (or _nodes_) that compute values and/or process streams of data objects. Operators are connected in a dependency graph structure, and each has a `value` property indicating the computed value for that node.

To access dataflow operators for the top-level scope, using the `view._runtime` property. Note that this is not an "official" part of the Vega API, but nonetheless can useful for advanced debugging. **Do not modify any properties within the runtime object.** If modified, the subsequent visualization behavior is undefined.

```js
view._runtime // {signals: {}, data: {}, scales: {}, nodes: {}, subcontext: [], ...}
```

The runtime scope object includes properties for:
- `signals` - Dataflow operators corresponding to each named signal.
- `data` - Holds `input`, `output` and `values` nodes for each named data set. Inspect the `input` node for pre-transform data objects; inspect the `values` node for post-transform data objects.
- `scales` - Dataflow operators corresponding to named scales and projections.
- `nodes` - An id-based lookup table of all dataflow operators in the current scope (including transforms).
- `subcontext` - An array of recursive runtime scopes for nested group marks.

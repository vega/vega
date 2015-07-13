# vega-dataflow

[Vega](http://github.com/vega/vega) dataflow graph.

Classes and utilities for a reactive dataflow graph that can process both scalar and streaming relational data. A central `Graph` instance manages and schedules a collection of `Node` instances, each of which is an operator in the dataflow. A `Signal` is a special type of node that maintains the latest value defined over a dynamic data stream. A `Node` may be connected to another via dependencies of varying granularity (e.g., based on data tuples, specific data fields and/or signal values).

Upon update, the `Graph` propagates (or "pulses") an update through the network in the form of a `ChangeSet`, triggering targeted recomputation of nodes in a topologically-sorted order.

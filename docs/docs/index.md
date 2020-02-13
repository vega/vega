---
layout: docs
title: Documentation
permalink: /docs/index.html
---

The **Vega** visualization grammar provides basic building blocks for a wide variety of visualization designs. This page provides documentation of [Vega JSON specifications](#specification) and [JavaScript API](#api).

To start learning Vega, we recommend first working through the introductory **[Let's Make A Bar Chart tutorial](../tutorials/bar-chart)** and exploring the [example gallery](../examples), then digging into the documentation. These pages document _Vega version 3.0 and later_; if you are familiar with Vega 2.x, you might begin with the [**Vega 2 porting guide**](porting-guide).


## <a name="specification"></a>Specification Reference

A **Vega specification** is a [JSON](http://en.wikipedia.org/wiki/JSON) object that describes an interactive visualization design. A [specification](specification) consists of basic properties (such as the width and height of the view) and definitions for the [data](data) to visualize, [scales](scales) that map data values to visual values, [axes](axes) and [legends](legends) that visualize these scales, cartographic [projections](projections) for drawing maps, graphical [marks](marks) such as rectangles, lines, and symbols to visually represent data, and [signals](signals) to process user input and modify the visualization in response.

| :----------------------------- | :----------- |
| [Specification](specification) | Overview of a full Vega specification, including sizing and metadata.|
| [Config](config)               | Configure defaults for visual encoding choices.|
| [Data](data)                   | Define, load, and parse data to visualize.|
| [Transforms](transforms)       | Apply data transforms (filter, sort, aggregate, layout) prior to visualization.|
| [Triggers](triggers)           | Modify data sets or mark properties in response to signal values.|
| [Projections](projections)     | Cartographic projections to map (longitude, latitude) data.|
| [Scales](scales)               | Map data values (numbers, strings) to visual properties (coordinates, colors, sizes).|
| [Schemes](schemes)             | Color schemes that can be used as scale ranges.|
| [Axes](axes)                   | Visualize scale mappings for spatial encodings using coordinate axes.|
| [Legends](legends)             | Visualize scale mappings for color, shape and size encodings.|
| [Title](title)                 | Specify a chart title for a visualization.|
| [Marks](marks)                 | Visually encode data with graphical marks such as rectangles, lines, and symbols.|
| [Signals](signals)             | Dynamic variables that can drive interactive updates.|
| [Event Streams](event-streams) | Define input event streams to specify interactions.|
| [Expressions](expressions)     | Express custom calculations over data and signals.|
| [Layout](layout)               | Perform grid layout for a collection of group marks.|
| [Types](types)                 | Documentation of recurring parameter types.|


## <a name="api"></a>Vega API Reference

Vega also provides a **JavaScript runtime API**, responsible for parsing JSON specifications to produce interactive views backed by a reactive dataflow graph of data processing operators. For more on deploying Vega, see the [usage instructions](../usage).

| :----------------------------- | :------------------ |
| [Parser](api/parser)           | Parse Vega JSON specifications to dataflow descriptions. |
| [View](api/view)               | Create interactive views from dataflow descriptions. |
| [Locale](api/locale)           | Use number and date formats for a specific locale. |
| [Extensibility](api/extensibility) | Extend Vega with new projections, scales, color schemes, or data transforms. |
| [Statistics](api/statistics)   | Statistical methods used by Vega. |
| [Time](api/time)               | Utility methods for date-time values. |
| [Util](api/util)               | General JavaScript utilities. |
| [Debugging](api/debugging)     | A guide to debugging Vega visualizations at runtime. |

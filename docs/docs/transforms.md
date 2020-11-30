---
layout: transform
title: Transforms
permalink: /docs/transforms/index.html
---

**Transforms** process a data stream to filter data, calculate new fields, or derive new data streams. Transforms are typically specified within the `transform` array of a [data](../data) definition. In addition, transforms that do not filter or generate new data objects can be used within the `transform` array of a [mark](../marks) definition to specify post-encoding transforms.

The following example defines a new data set with transforms to filter values and then compute a stacked layout (e.g., for a stacked bar chart):

```json
{
  "data": [
    {
      "name": "table",
      "transform": [
        { "type": "filter", "expr": "datum.value > 5" },
        { "type": "stack", "field": "value", "groupby": ["category"] }
      ]
    }
  ]
}
```

All transforms require a _type_ property, specifying the name of the transform. Transforms that produce a value as a side-effect (in particular, the [bin](bin), [extent](extent), and [crossfilter](crossfilter) transforms) can include a _signal_ property to specify a unique signal name to which to bind the transform's state value.

## Basic Transforms

Transforms for processing streams of data objects.

- [`aggregate`](aggregate) - Group and summarize a data stream.
- [`bin`](bin) - Discretize numeric values into uniform bins.
- [`collect`](collect) - Collect and sort all data objects in a stream.
- [`countpattern`](countpattern) - Count the frequency of patterns in text strings.
- [`cross`](cross) - Perform a cross-product of a data stream with itself.
- [`density`](density) - Generate values drawn from a probability distribution.
- [`dotbin`](dotbin) - Perform density binning for dot plot construction. {% include tag ver="5.7" %}
- [`extent`](extent) - Compute minimum and maximum values over a data stream.
- [`filter`](filter) - Filter a data stream using a predicate expression.
- [`flatten`](flatten) - Map array-typed fields to data objects, one per array entry. {% include tag ver="3.1" %}
- [`fold`](fold) - Collapse selected data fields into _key_ and _value_ properties.
- [`formula`](formula) - Extend data objects with derived fields using a formula expression.
- [`identifier`](identifier) - Assign unique key values to data objects.
- [`kde`](kde) - Estimate smoothed densities for numeric values. {% include tag ver="5.4" %}
- [`impute`](impute) - Perform imputation of missing values.
- [`joinaggregate`](joinaggregate) - Extend data objects with calculated aggregate values.
- [`loess`](loess) - Fit a smoothed trend line using local regression. {% include tag ver="5.4" %}
- [`lookup`](lookup) - Extend data objects by looking up key values on another stream.
- [`pivot`](pivot) - Pivot unique values to new aggregate fields. {% include tag ver="3.2" %}
- [`project`](project) - Generate derived data objects with a selected set of fields.
- [`quantile`](quantile) - Calculate sample quantile values over an input data stream. {% include tag ver="5.7" %}
- [`regression`](regression) - Fit regression models to smooth and predict values. {% include tag ver="5.4" %}
- [`sample`](sample) - Randomly sample data objects in a stream.
- [`sequence`](sequence) - Generate a new stream containing a sequence of numeric values.
- [`timeunit`](timeunit) - Discretize date-time values into time unit bins. {% include tag ver="5.8" %}
- [`window`](window) - Calculate over ordered groups, including ranking and running totals.

## Geographic and Spatial Transforms

Transforms for modeling spatial data, cartographic projection, and geographic guides.

- [`contour`](contour) - _Deprecated._ Model a spatial distribution using discrete levels.
- [`geojson`](geojson) - Consolidate geographic data into a GeoJSON feature collection.
- [`geopath`](geopath) - Map GeoJSON features to SVG path strings.
- [`geopoint`](geopoint) - Map (longitude, latitude) coordinates to (x, y) points.
- [`geoshape`](geoshape) - Map GeoJSON features to a shape instance for procedural drawing.
- [`graticule`](graticule) - Generate a reference grid for cartographic maps.
- [`heatmap`](heatmap) - Generate heatmap images for raster grid data. {% include tag ver="5.8" %}
- [`isocontour`](isocontour) - Generate level set contours for raster grid data. {% include tag ver="5.8" %}
- [`kde2d`](kde2d) - Estimate 2D densities as output raster grids. {% include tag ver="5.8" %}

## Layout Transforms

Transforms for calculating spatial coordinates to achieve various layouts.

- [`force`](force) - Compute a force-directed layout via physical simulation.
- [`label`](label) - Compute text position and opacity to label a chart. {% include tag ver="5.16" %}
- [`linkpath`](linkpath) - Route visual links between node elements.
- [`pie`](pie) - Compute angular layout for pie and donut charts.
- [`stack`](stack) - Compute stacked layouts for groups of values.
- [`voronoi`](voronoi) - Compute a Voronoi diagram for a set of points.
- [`wordcloud`](wordcloud) - Compute a word cloud layout of text strings.

## Hierarchy Transforms

Transforms for processing hierarchy (tree) data and performing tree layout.

- [`nest`](nest) - Generate a tree structure by grouping objects by field values.
- [`stratify`](stratify) - Generate a tree structure using explicit key values.
- [`treelinks`](treelinks) - Generate link data objects for a tree structure.
- [`pack`](pack) - Tree layout based on circular enclosure.
- [`partition`](partition) - Tree layout based on spatial adjacency of nodes.
- [`tree`](tree) - Tree layout for a node-link diagram.
- [`treemap`](treemap) - Tree layout based on recursive rectangular subdivision.

## Cross-Filter Transforms

Transforms for supporting fast incremental filtering of multi-dimensional data.

- [`crossfilter`](crossfilter) - Maintain a filter mask for multiple dimensional queries.
- [`resolvefilter`](resolvefilter) - Resolve crossfilter output to generate filtered data streams.

## Custom Transforms

In addition to the above, custom transformations can also be added to Vega as part of its Extensibility API.
See the [Transformations](https://vega.github.io/vega/docs/api/extensibility/#transform) section of the API documentation.

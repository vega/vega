---
layout: transform
title: CrossFilter Transform
permalink: /docs/transforms/crossfilter/index.html
---

The **crossfilter** transform maintains a filter mask for multiple dimensional queries, using a set of sorted indices. This transform can be used in conjunction with the [resolvefilter](../resolvefilter) transform to enable fast interactive querying over large data sets. This transform is inspired by the [Crossfilter library](http://crossfilter.github.io/crossfilter/) developed by Mike Bostock and collaborators.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| fields              | {% include type t="Field[]" %}  | {% include required %} An array of data fields to filter. The same field may be included more than once to specify multiple queries.|
| queries             | {% include type t="Array[]" %}  | {% include required %} An array of per-field range queries. Each entry must resolve to a two-element number array, indicating the minimum (inclusive) and maximum (exclusive) values that should pass through the filter.|
| signal              | {% include type t="String" %}   | If defined, binds the computed filter mask to a signal with the given name.|

This transform writes to the property `_index` on each input data object. If other transforms overwrite this property, the resulting behavior is undefined.

## Usage

This example cross-filters the _delay_, _time_, and _distance_ fields in a data set of flights. The `crossfilter` transform sets up the filters, using range queries defined by signal values. The three derived data sets use `resolvefilter` transforms to filter the data, in each case ignoring one of the fields. For example, the `"filterTimeDistance"` data set filters the data by the _time_ and _distance_ queries, ignoring the _delay_ query.

{: .suppress-error}
```json
{
  "signals": [
    { "name": "delayRange", "value": [-60, 180] },
    { "name": "timeRange", "value": [0, 24] },
    { "name": "distanceRange", "value": [0, 2400] },
  ],
  "data": [
    {
      "name": "flights",
      "url": "data/flights-200k.json",
      "transform": [
        {
          "type": "crossfilter",
          "signal": "xfilter",
          "fields": ["delay", "time", "distance"],
          "query": [
            {"signal": "delayRange"},
            {"signal": "timeRange"},
            {"signal": "distanceRange"}
          ]
        }
      ]
    },
    {
      "name": "filterTimeDistance",
      "source": "flights",
      "transform": [
        {
          "type": "resolvefilter",
          "filter": {"signal": "xfilter"},
          "ignore": 1
        },
        ...
      ]
    },
    {
      "name": "filterDelayDistance",
      "source": "flights",
      "transform": [
        {
          "type": "resolvefilter",
          "filter": {"signal": "xfilter"},
          "ignore": 2
        },
        ...
      ]
    },
    {
      "name": "filterDelayTime",
      "source": "flights",
      "transform": [
        {
          "type": "resolvefilter",
          "filter": {"signal": "xfilter"},
          "ignore": 4
        },
        ...
      ]
    }
  ]
}
```

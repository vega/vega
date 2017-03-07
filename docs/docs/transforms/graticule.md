---
layout: transform
title: Graticule Transform
permalink: /docs/transforms/graticule/index.html
---

The **graticule** transform generates a reference grid for cartographic maps. A graticule is a uniform grid of meridians and parallels for showing projection distortion. The default graticule has meridians and parallels every 10° between ±80° latitude; for the polar regions, there are meridians every 90°.

This transform generates a new data stream containing a single [GeoJSON](https://en.wikipedia.org/wiki/GeoJSON) data object for the graticule, which can subsequently be drawn using the [geopath](../geopath) or [geoshape](../geoshape) transform. This transform uses the [d3-geo](https://github.com/d3/d3-geo) library.

## Example

{% include embed spec="graticule" %}

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| field               | {% include type t="Field" %}   | The data field to bin.|
| extentMajor         | {% include type t="Array[]" %} | The major extent of the graticule as a two-element array of coordinates.|
| extentMinor         | {% include type t="Array[]" %} | The minor extent of the graticule as a two-element array of coordinates.|
| extent              | {% include type t="Array[]" %} | Sets both the major and minor extents to the same values.|
| stepMajor           | {% include type t="Number[]" %}| The major step angles of the graticule (default `[90, 360]`).|
| stepMinor           | {% include type t="Number[]" %}| The minor step angles of the graticule (default `[10, 10]`).|
| step                | {% include type t="Number[]" %}| Sets both the major and minor step angles to the same values.|
| precision           | {% include type t="Number" %}  | The precision of the graticule in degrees (default `2.5`).|

## Usage

```json
{"type": "graticule", "stepMinor": [15, 15]}
```

Generates a new graticule data stream with minor parallels and meridians spaced every 15°.

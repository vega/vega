---
layout: transform
title: GeoPath Transform
permalink: /docs/transforms/geopath/index.html
---

The **geopath** transform maps [GeoJSON](https://en.wikipedia.org/wiki/GeoJSON) features to [SVG path strings](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) according to a provided cartographic [projection](../../projections). It is intended for use with the [path](../../marks/path) mark type. This transform is similar in functionality to the [geoshape](../geoshape) transform, but immediately generates SVG path strings, rather than producing a shape instance that delays projection until the rendering stage. The [geoshape](../geoshape) transform may have better performance for the case of canvas-rendered dynamic maps.

This transform uses the [d3-geo](https://github.com/d3/d3-geo) library.

## Example

{% include embed spec="geopath" %}

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| projection          | {% include type t="String" %}  | The name of the projection to use. If unspecified, the GeoJSON data will not be projected.|
| field               | {% include type t="Field" %}   | The data field containing GeoJSON data. If unspecified, the full input data object will be used.|
| pointRadius         | {% include type t="Number|Expr" %} | Sets the default radius (in pixels) to use when drawing GeoJSON `Point` and `MultiPoint` geometries. An expression value can be used to set the point radius as a function of properties of the input GeoJSON. {% include tag ver="3.1" %}|
| as                  | {% include type t="String" %}  | The output field to write. The default is `"path"`.|

## Usage

```json
{
  "type": "geopath",
  "projection": "projection"
}
```

Generates path data for GeoJSON objects, using the specified projection. Results are written to the default output field `path`.

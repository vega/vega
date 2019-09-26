---
layout: transform
title: GeoShape Transform
permalink: /docs/transforms/geoshape/index.html
---

The **geoshape** transform generates a renderer instance that maps [GeoJSON](https://en.wikipedia.org/wiki/GeoJSON) features to a shape instance that issues drawing commands. It is intended for use solely with the [shape](../../marks/shape) mark type. This transform is similar in functionality to the [geopath](../geopath) transform, but rather than generate intermediate SVG path strings, this transform produces a shape instance that directly generates drawing commands during rendering. This transform can result in improved performance when using canvas rendering for dynamic maps.

This transform uses the [d3-geo](https://github.com/d3/d3-geo) library.

## Example

{% include embed spec="geoshape" %}

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| projection          | {% include type t="String" %}  | The name of the projection to use. If unspecified, the GeoJSON data will not be projected. |
| field               | {% include type t="Field" %}   | The data field containing GeoJSON data. If unspecified, the full input data object will be used.|
| pointRadius         | {% include type t="Number|Expr" %} | Sets the default radius (in pixels) to use when drawing GeoJSON `Point` and `MultiPoint` geometries. An expression value can be used to set the point radius as a function of properties of the input GeoJSON. {% include tag ver="3.1" %} |
| as                  | {% include type t="String" %}  | The output field at which to write the generated shape instance. The default is `"shape"`.|

## Usage

```json
{
  "type": "geoshape",
  "projection": "projection"
}
```

Generates a shape instance for GeoJSON objects, using the specified projection.

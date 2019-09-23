---
layout: transform
title: GeoJSON Transform
permalink: /docs/transforms/geojson/index.html
---

The **geojson** transform consolidates geographic data into a single [GeoJSON](https://en.wikipedia.org/wiki/GeoJSON) feature collection. The generated GeoJSON data can then be used to parameterize other parts of a Vega specification, namely the [projection `fit` parameter](../../projections/). This transform can process both latitude / longitude data and existing GeoJSON features.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| fields              | {% include type t="Field[]" %} | Data fields containing longitude and latitude values, respectively.|
| geojson             | {% include type t="Field" %}   | Data field containing GeoJSON [Feature objects](https://tools.ietf.org/html/rfc7946#section-3.2). For Vega versions {% include tag ver="5.7" %}, this parameter defaults to the identity function (treat input data objects as GeoJSON Feature objects) if neither this parameter nor the _fields_ parameter are specified.|

## Usage

In the midst of a data transform array, one can include a **geojson** transform and bind it to a new signal name (here, `geodata`):

```json
{
  "type": "geojson",
  "fields": ["longitude", "latitude"],
  "signal": "geodata"
}
```

Elsewhere, the `geodata` signal can be used to refer to the consolidated GeoJSON data, as in a projection:

{: .suppress-error}
```json
"projections": [
  {
    "name": "proj",
    "type": "mercator",
    "fit": {"signal": "geodata"}
  }
]
```
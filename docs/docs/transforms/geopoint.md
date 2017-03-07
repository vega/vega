---
layout: transform
title: GeoPoint Transform
permalink: /docs/transforms/geopoint/index.html
---

The **geopoint** transform projects (longitude, latitude) pairs to (x, y) coordinates according to a given cartographic [projection](../../projections).

## Example

{% include embed spec="geopoint" %}

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| projection          | {% include type t="String" %}  | {% include required %} The name of the projection to use.|
| fields              | {% include type t="Field[]" %} | {% include required %} The data fields containing the longitude and latitude values, respectively.|
| as                  | {% include type t="String[]" %}| The output fields to write. The default is `["x", "y"]`.|

## Usage

```json
{
  "type": "geopoint",
  "fields": ["lon", "lat"]
}
```

Projects (longitude, latitude) pairs pulled from the `lon` and `lat` data fields, and writes the results to the `x` and `y` fields.

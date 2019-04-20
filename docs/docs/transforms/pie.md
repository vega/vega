---
layout: transform
title: Pie Transform
permalink: /docs/transforms/pie/index.html
---

The **pie** transform calculates the angular extents of arc segments laid out in a circle. The most common use case is to create pie charts and donut charts. This transform writes two properties to each datum, indicating the starting and ending angles (in radians) of an arc.

## Example

{% include embed spec="pie" %}

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| field               | {% include type t="Field" %}   | The data values from this field will be encoded as angular spans. If omitted, all pie slices will have equal spans.|
| startAngle          | {% include type t="Number" %}  | The starting angle of the pie in radians (default `0`).|
| endAngle            | {% include type t="Number" %}  | The end angle of the pie in radians (default `2 * PI`).|
| sort                | {% include type t="Boolean" %} | If true, sorts the arcs according to field values (default `false`).|
| as                  | {% include type t="String[]" %}| The output fields for the computed start and end angles for each arc. The default is `["startAngle", "endAngle"]`.|

## Usage

```json
{"type": "pie", "field": "price"}
```

Computes angular extents for pie slices based on the field price.

```json
{"type": "pie"}
```

Computes angular extents for equal-width pie slices.

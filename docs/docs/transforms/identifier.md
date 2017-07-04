---
layout: transform
title: Identifier Transform
permalink: /docs/transforms/identifier/index.html
---

The **identifier** transform extends data objects with a globally unique key value. Identifier values are assigned using an internal counter. This counter is shared across all instances of this transform within a single Vega view, including different data sources. Note, however, that the counter is _not_ shared across different Vega views.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| as                  | {% include type t="String" %}  | {% include required %} The output field at which to write the unique identifier value.|

## Usage

```json
{"type": "identifier", "as": "id"}
```

This example writes unique identifier values to the `id` field of each newly seen data object.

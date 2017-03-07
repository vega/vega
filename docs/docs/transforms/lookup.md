---
layout: transform
title: Lookup Transform
permalink: /docs/transforms/lookup/index.html
---

The **lookup** transform extends a primary data stream by looking up values on a secondary data stream. Lookup accepts one or more key fields from the primary data stream, each of which are then searched for in a single key field of the secondary data stream. If a match is found, the full data object in the secondary stream is added as a property of the data object in the primary stream.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| from                | {% include type t="Data" %}    | {% include required %} The name of the secondary data stream upon which to perform the lookup.|
| key                 | {% include type t="Field" %}   | {% include required %} The key field on the secondary stream.|
| fields              | {% include type t="Field[]" %} | {% include required %} The data fields in the primary stream to lookup.|
| as                  | {% include type t="String[]" %}| {% include required %} The output fields at which to write the data objects found in the secondary data stream.|
| default             | {% include type t="Any" %}     | The default value to use if lookup fails (default `null`).|

## Usage

```json
{
  "type": "lookup",
  "from": "unemployment",
  "key": "key",
  "fields": ["id"],
  "as": ["value"],
  "default": null
}
```

For each data object in the input data stream, this example lookups records where the `key` field of the the data stream `unemployment` matches the `id` field of the input stream. Matching records are added to the input stream under the field named `value`.

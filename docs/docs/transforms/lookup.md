---
layout: transform
title: Lookup Transform
permalink: /docs/transforms/lookup/index.html
---

The **lookup** transform extends a primary data stream by looking up values on a secondary data stream. Lookup accepts one or more key fields from the primary data stream, each of which are then searched for in a single key field of the secondary data stream.

If a match is found, by default the full data object in the secondary stream is added as a property of the data object in the primary stream. However, if the _values_ parameter is supplied, the provided field names will instead be copied from the matched object to the primary object, maintaining a "flat" record structure.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| from                | {% include type t="Data" %}    | {% include required %} The name of the secondary data stream upon which to perform the lookup.|
| key                 | {% include type t="Field" %}   | {% include required %} The key field on the secondary stream.|
| values              | {% include type t="Field[]" %} | The data fields to copy from the secondary stream to the primary stream. If not specified, a reference to the full data record is copied.|
| fields              | {% include type t="Field[]" %} | {% include required %} The data fields in the primary stream to lookup.|
| as                  | {% include type t="String[]" %}| The output fields at which to write data found in the secondary stream. If not specified and a _values_ parameter is supplied, the names of the fields in the _values_ array will be used. This parameter is required if multiple _fields_ are provided or _values_ is unspecified.|
| default             | {% include type t="Any" %}     | The default value to assign if lookup fails (default `null`).|

## Usage

For each data object in the input data stream, this example lookups records where the `key` field of the the data stream `unemployment` matches the `id` field of the input stream. Matching records are added to the input stream under the field named `value`.

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

This example is similar to the previous example, except that instead of copying a reference to the full data record found in the lookup, the `"rate"` data field value is copied directly to objects in the primary data stream:

```json
{
  "type": "lookup",
  "from": "unemployment",
  "key": "key",
  "values": ["rate"],
  "fields": ["id"],
  "as": ["value"],
  "default": null
}
```

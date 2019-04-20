---
layout: transform
title: Sample Transform
permalink: /docs/transforms/sample/index.html
---

The **sample** transform randomly samples a data stream to create a smaller stream. As input data objects are added and removed, the sampled values may change in first-in, first-out manner. This transform uses [reservoir sampling](https://en.wikipedia.org/wiki/Reservoir_sampling) to maintain a representative sample of the stream.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| size                | {% include type t="Number" %}  | The maximum number of data objects to include in the sample. The default value is `1000`.|

## Usage

```json
{"type": "sample", "size": 500}
```

Filters a data stream to a random sample of at most 500 data objects.

---
layout: mark
title: Path Mark
permalink: /docs/marks/path/index.html
---

**Path** marks are arbitrary shapes, defined as an [SVG path](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths). Path marks can be used to represent custom shapes, including geographic regions on maps.

## Example

{% include embed spec="path" %}

## Type-Specific Mark Properties

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| path                | {% include type t="String" %}  | An [SVG path string](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) describing the geometry of the path.|

{% include properties.md %}

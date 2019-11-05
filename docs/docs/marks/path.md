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
| angle               | {% include type t="Number" %}  | {% include tag ver="5.8" %} The angle (in degrees) by which to rotate the symbol (default `0`).|
| scaleX              | {% include type t="Number" %}  | {% include tag ver="5.8" %} The scale factor by which to scale the path horizontally, prior to any rotation (default `1`).|
| scaleY              | {% include type t="Number" %}  | {% include tag ver="5.8" %} The scale factor by which to scale the path vertically, prior to any rotation (default `1`).|

{% include properties.md %}

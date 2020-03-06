---
layout: mark
title: Symbol Mark
permalink: /docs/marks/symbol/index.html
---

**Symbol** marks are shapes useful for plotting data, and include circles, squares and oriented triangles. Symbol size can be scaled to indicate magnitudes. In addition to a set of built-in shapes, custom shapes can be defined using [SVG path strings](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths).

## Example

{% include embed spec="symbol" %}

## Type-Specific Mark Properties

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| angle               | {% include type t="Number" %}  | The angle (in degrees) by which to rotate the symbol (default `0`). {% include tag ver="5.0" %} |
| size                | {% include type t="Number" %}  | The area in pixels of the symbols bounding box. Note that this value sets the _area_ of the symbol; the side lengths will increase with the square root of this value. |
| shape               | {% include type t="String" %}  | The symbol shape. One of the plotting shapes `circle` (default), `square`, `cross`, `diamond`, `triangle-up`, `triangle-down`, `triangle-right`, or `triangle-left`, the line symbol `stroke`, or one of the centered directional shapes `arrow`, `wedge`, or `triangle`. Alternatively, a custom [SVG path string](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) can be provided. For correct sizing, custom shape paths should be defined within a square bounding box with coordinates ranging from -1 to 1 along both the x and y dimensions. |

{% include properties.md %}

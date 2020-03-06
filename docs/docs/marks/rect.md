---
layout: mark
title: Rect Mark
permalink: /docs/marks/rect/index.html
---

**Rect** marks are rectangles with a given position, width and height. Rect marks are useful in a wide variety of visualizations, including bar charts and timelines.

## Example

{% include embed spec="rect" %}

## Type-Specific Mark Properties

| Property                | Type                           | Description   |
| :---------------------- | :----------------------------: | :------------ |
| cornerRadius            | {% include type t="Number" %}  | The radius in pixels of rounded rectangle corners for all four corners (default `0`). |
| cornerRadiusTopLeft     | {% include type t="Number" %}  | The radius in pixels of a rounded rectangle corner for the top left corner. If specified, this property takes precedence over the _cornerRadius_ property. {% include tag ver="5.8" %} |
| cornerRadiusTopRight    | {% include type t="Number" %}  | The radius in pixels of a rounded rectangle corner for the top right corner. If specified, this property takes precedence over the _cornerRadius_ property. {% include tag ver="5.8" %} |
| cornerRadiusBottomLeft  | {% include type t="Number" %}  | The radius in pixels of a rounded rectangle corner for the bottom left corner. If specified, this property takes precedence over the _cornerRadius_ property. {% include tag ver="5.8" %} |
| cornerRadiusBottomRight | {% include type t="Number" %}  | The radius in pixels of a rounded rectangle corner for the bottom right corner. If specified, this property takes precedence over the _cornerRadius_ property. {% include tag ver="5.8" %} |

{% include properties.md %}

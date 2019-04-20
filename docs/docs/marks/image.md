---
layout: mark
title: Image Mark
permalink: /docs/marks/image/index.html
---

**Image** marks allow external images, such as icons or photographs, to be included in Vega visualizations. Image files such as PNG or JPG images are loaded from provided URLs.

## Example

{% include embed spec="image" %}

## Type-Specific Mark Properties

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| url                 | {% include type t="URL" %}     | The URL of the image file. |
| aspect              | {% include type t="Boolean" %} | A boolean flag (default `true`) indicating if the image aspect ratio should be preserved.|
| align               | {% include type t="String" %}  | The horizontal alignment of the image. One of `left`, `center`, or `right`. The default value is `left`.|
| baseline            | {% include type t="String" %}  | The vertical alignment of the image. One of `top`, `middle`, or `bottom`. The default value is `top`.|

{% include properties.md %}

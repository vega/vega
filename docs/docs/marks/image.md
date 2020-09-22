---
layout: mark
title: Image Mark
permalink: /docs/marks/image/index.html
---

**Image** marks allow external images, such as icons or photographs, to be included in Vega visualizations. Image files such as PNG or JPG images can be loaded from provided URLs, or specified directly as data properties.

## Example

{% include embed spec="image" %}

## Type-Specific Mark Properties

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| url                 | {% include type t="URL" %}     | The URL of the image file. |
| image               | [Canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas) \| [Image](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image)     | The image instance to show. This property can be used to include dynamically generated images. This property is ignored if _url_ is specified. {% include tag ver="5.8" %} |
| aspect              | {% include type t="Boolean" %} | A boolean flag (default `true`) indicating if the image aspect ratio should be preserved across sizes. If `true` and only one of the dimensional (*width* or *height*) properties are defined, the other dimensional property will be calculated to match the aspect ratio of the loaded image file. |
| smooth              | {% include type t="Boolean" %} | A boolean flag (default `true`) indicating if the image should be smoothed when resized. If `false`, individual pixels should be scaled directly rather than interpolated with smoothing. For SVG rendering, this option may not work in some browsers due to lack of standardization. {% include tag ver="5.8" %} |
| align               | {% include type t="String" %}  | The horizontal alignment of the image. One of `left`, `center`, or `right`. The default value is `left`. |
| baseline            | {% include type t="String" %}  | The vertical alignment of the image. One of `top`, `middle`, or `bottom`. The default value is `top`. |

{% include properties.md %}

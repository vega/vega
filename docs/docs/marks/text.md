---
layout: mark
title: Text Mark
permalink: /docs/marks/text/index.html
---

**Text** marks can be used to annotate data, and provide labels and titles for axes and legends.

## Example

{% include embed spec="text" %}

## Type-Specific Mark Properties

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| align               | {% include type t="String" %}  | The horizontal text alignment. One of `left` (default), `center`, or `right`. |
| angle               | {% include type t="Number" %}  | The rotation angle of the text in degrees (default `0`). |
| baseline            | {% include type t="String" %}  | The vertical text baseline. One of `alphabetic` (default), `top`, `middle`, `bottom`, `line-top`, or `line-bottom`. The `line-top` and `line-bottom` values {% include tag ver="5.10" %} operate similarly to `top` and `bottom`, but are calculated relative to the *lineHeight* rather than *fontSize* alone. |
| dir                 | {% include type t="String" %}  | The direction of the text. One of `ltr` (left-to-right, default) or `rtl` (right-to-left). This property determines on which side is truncated in response to the _limit_ parameter. |
| dx                  | {% include type t="Number" %}  | The horizontal offset in pixels (before rotation), between the text and anchor point. |
| dy                  | {% include type t="Number" %}  | The vertical offset in pixels (before rotation), between the text and anchor point. |
| ellipsis            | {% include type t="String" %}  | The ellipsis string for text truncated in response to the _limit_ parameter (default "&hellip;"). |
| font                | {% include type t="String" %}  | The typeface to set the text in (e.g., `Helvetica Neue`). |
| fontSize            | {% include type t="Number" %}  | The font size in pixels. |
| fontWeight          | {% include type t="String|Number" %}  | The font weight (e.g., `normal` or `bold`). |
| fontStyle           | {% include type t="String" %}  | The font style (e.g., `normal` or `italic`). |
| lineBreak           | {% include type t="String" %}  | A delimiter, such as a newline character, upon which to break text strings into multiple lines. This property will be ignored if the *text* property is array-valued. {% include tag ver="5.7" %} |
| lineHeight          | {% include type t="Number" %}  | The height, in pixels, of each line of text in a multi-line text mark or a text mark with `"line-top"` or `"line-bottom"` baseline. {% include tag ver="5.7" %} |
| limit               | {% include type t="Number" %}  | The maximum length of the text mark in pixels (default `0`, indicating no limit). The _text_ value will be automatically truncated if the rendered size exceeds the limit. |
| radius              | {% include type t="Number" %}  | Polar coordinate radial offset in pixels, relative to the origin determined by the _x_ and _y_ properties (default `0`). |
| text                | {% include type t="String|String[]" %}  | The text to display. This text may be truncated if the rendered length of the text exceeds the _limit_ parameter. For versions {% include tag ver="5.7" %}, a string array specifies multiple lines of text. For versions {% include tag ver="5.10" %}, all text lines are white-space trimmed prior to rendering.|
| theta               | {% include type t="Number" %}  | Polar coordinate angle in radians, relative to the origin determined by the _x_ and _y_ properties (default `0`). Values for `theta` follow the same convention of `arc` marks: angles are measured in radians, with `0` indicating up or "north". |

The _x_ and _y_ properties determine an _anchor point_ for the text. Additional positioning parameters, including _dx_, _dy_, _radius_, and _theta_, are applied relative to this point.

{% include properties.md %}

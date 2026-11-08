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
| textProcessor       | {% include type t="String" %}  | The name of a registered [text processor](../../api/extensibility/#textProcessor) used to render the text, such as `"tex"` to typeset LaTeX math. The value `"default"` selects standard text rendering, overriding any inherited text processor. {% include tag ver="6.5" %} |
| textSelectable      | {% include type t="Boolean" %}  | For processed text in SVG output, whether to include an invisible text layer that allows the text to be selected, copied and searched (default `true`). Ignored by canvas output. {% include tag ver="6.5" %} |
| theta               | {% include type t="Number" %}  | Polar coordinate angle in radians, relative to the origin determined by the _x_ and _y_ properties (default `0`). Values for `theta` follow the same convention of `arc` marks: angles are measured in radians, with `0` indicating up or "north". |

The _x_ and _y_ properties determine an _anchor point_ for the text. Additional positioning parameters, including _dx_, _dy_, _radius_, and _theta_, are applied relative to this point.

## <a name="text-processors"></a>Text Processors {% include tag ver="6.5" %}

A _text processor_ renders text using an external library, such as typesetting math notation in LaTeX, MathML or AsciiMath using [MathJax](https://www.mathjax.org/). Text processors are registered at runtime using the [`textProcessor`](../../api/extensibility/#textProcessor) method, which includes an [example using MathJax](../../api/extensibility/#textProcessor_mathjax). Set the _textProcessor_ property to the name of a registered processor to use it:

{: .suppress-error}
```json
{
  "type": "text",
  "encode": {
    "enter": {
      "x": {"value": 10},
      "y": {"value": 30},
      "fontSize": {"value": 16},
      "text": {"value": "e^{i\\pi} + 1 = 0"},
      "textProcessor": {"value": "tex"}
    }
  }
}
```

The same capability is available for [titles](../../title) (_textProcessor_ and _subtitleTextProcessor_), [axes](../../axes) and [legends](../../legends) (_labelTextProcessor_ and _titleTextProcessor_), and through [config](../../config) and styles. The value `"default"` selects standard text rendering, and can be used to override an inherited processor.

Processed text is rendered as an image with the mark's _fontSize_ and _fill_ color (or _stroke_ color, if unfilled), and its bounds use the true dimensions of the processed output, so that layout, alignment (_align_, _baseline_, _angle_, _dx_, _dy_, _radius_, _theta_) and label overlap removal work as for standard text. In SVG output, the source text is used as an `aria-label` for accessibility and, unless _textSelectable_ is `false`, as an invisible text layer so that the text can be selected, copied and found by text search.

Notes:

- The _font_, _fontStyle_, _fontWeight_, _limit_, _ellipsis_, _lineBreak_ and _lineHeight_ properties do not apply to processed text, and array-valued text is joined using spaces. Gradient fills are drawn in black.
- If a text processor is not registered, or fails to process a text value, the text is rendered using standard text rendering and a warning is logged. This ensures that specifications remain viewable in environments without the processor.
- Text processing occurs during dataflow evaluation, and results are cached. If a processor needs to load resources (such as font data), evaluation waits for them before rendering. For text values driven by signals that change frequently, consider formatting values (e.g., rounding numbers) to limit the number of distinct strings to process.
- Within JSON, backslashes in LaTeX must be escaped (`"\\frac{a}{b}"`). Within expression strings, they must be escaped twice (`{"signal": "'\\\\frac{' + datum.a + '}{2}'"}`).

{% include properties.md %}

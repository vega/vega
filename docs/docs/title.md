---
layout: spec
title: Title
permalink: /docs/title/index.html
---

The **title** directive adds a descriptive title to a chart. Similar to scales, axes, and legends, a title can be defined at the top-level of a specification or as part of a [group mark](../marks/group).

## Title Properties

Properties for specifying a title.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| text          | {% include type t="String|String[]" %}  | {% include required %} The title text. For versions {% include tag ver="5.7" %}, a string array specifies multiple lines of text.|
| orient        | {% include type t="String" %}  | The orientation of the title and subtitle relative to the chart. One of `top` (the default), `bottom`, `left`, or `right`.|
| align         | {% include type t="String" %}  | Horizontal text alignment of the title and subtitle. If specified, this value overrides automatic alignment based on the _anchor_ value. |
| anchor        | {% include type t="String" %}  | The anchor position for placing the title and subtitle. One of `start`, `middle` (the default), or `end`. For example, with an orientation of `top` these anchor positions map to a left-, center-, or right-aligned title.|
| angle         | {% include type t="Number" %}  | Angle in degrees of the title and subtitle text. |
| baseline      | {% include type t="String" %}  | Vertical baseline of the title and subtitle text. One of `alphabetic` (default), `top`, `middle`, `bottom`, `line-top`, or `line-bottom`. The `line-top` and `line-bottom` values {% include tag ver="5.10" %} operate similarly to `top` and `bottom`, but are calculated relative to the *lineHeight* rather than *fontSize* alone. |
| color         | {% include type t="Color" %}   | Text color of the title text. |
| dx            | {% include type t="Number" %}  | Horizontal offset added to the title and subtitle x-coordinate. {% include tag ver="5.2" %} |
| dy            | {% include type t="Number" %}  | Vertical offset added to the title and subtitle y-coordinate. {% include tag ver="5.2" %} |
| encode        | {% include type t="Object" %}  | Optional mark encodings for custom title styling. In versions {% include tag ver="5.7" %}, supports encoding blocks for `group`, `title`, and `subtitle`. See [custom title encodings](#custom). The earlier support using a flat encoding block for the title text only is now **deprecated**; please use nested encoding blocks instead.|
| font          | {% include type t="String" %}  | Font name of the title text. |
| fontSize      | {% include type t="Number" %}  | Font size in pixels of the title text. |
| fontStyle     | {% include type t="String" %}  | Font style of the title text (e.g., `normal` or `italic`). {% include tag ver="5.0" %} |
| fontWeight    | {% include type t="String|Number" %}  | Font weight of the title text. |
| frame         | {% include type t="String" %}  | The reference frame for the anchor position, one of `"bounds"` (the default, to anchor relative to the full bounding box) or `"group"` (to anchor relative to the group width or height). |
| interactive   | {% include type t="Boolean" %} | A boolean flag indicating if the title element should respond to input events such as mouse hover. **Deprecated**: use a [custom _encode_ block](#custom) instead.|
| limit         | {% include type t="Number" %}  | The maximum allowed length in pixels of title and subtitle text. |
| lineHeight    | {% include type t="Number" %}  | Line height in pixels for multi-line title text or title text with `"line-top"` or `"line-bottom"` baseline. {% include tag ver="5.7" %} |
| name          | {% include type t="String" %}  | A [mark name](../marks) property to apply to the title text mark. **Deprecated**: use a [custom _encode_ block](#custom) instead.|
| offset        | {% include type t="Number|Value" %} | The orthogonal offset in pixels by which to displace the title from its position along the edge of the chart.|
| style         | {% include type t="String|String[]" %}  | A [mark style](../marks) property to apply to the title text mark. If not specified, a default style of `"group-title"` is applied. **Deprecated**: use a [custom _encode_ block](#custom) instead.|
| subtitle      | {% include type t="String|String[]" %}  | Optional subtitle text, placed beneath the primary text. A string array specifies multiple lines of text. {% include tag ver="5.7" %}|
| subtitleColor      | {% include type t="Color" %}   | Text color of the subtitle text. {% include tag ver="5.7" %}|
| subtitleFont       | {% include type t="String" %}  | Font name of the subtitle text. {% include tag ver="5.7" %}|
| subtitleFontSize   | {% include type t="Number" %}  | Font size in pixels of the subtitle text. {% include tag ver="5.7" %} |
| subtitleFontStyle  | {% include type t="String" %}  | Font style of the subtitle text (e.g., `normal` or `italic`). {% include tag ver="5.7" %} |
| subtitleFontWeight | {% include type t="String|Number" %}  | Font weight of the subtitle text. {% include tag ver="5.7" %} |
| subtitleLineHeight | {% include type t="Number" %}  | Line height in pixels for multi-line subtitle text. {% include tag ver="5.7" %} |
| subtitlePadding    | {% include type t="Number" %}  | Padding in pixels between title and subtitle text. {% include tag ver="5.7" %}|
| zindex             | {% include type t="Number" %}  | The integer z-index indicating the layering of the title group relative to other axis, mark, and legend groups. The default value is `0`.|

### Accessibility Properties {% include tag ver="5.11" %}

Accessibility properties are used to determine [ARIA (Accessible Rich Internet Applications) attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) when using Vega to render SVG output.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| aria          | {% include type t="Boolean" %}| A boolean flag (default `true`) indicating if ARIA attributes should be included (SVG output only). If `false`, the "aria-hidden" attribute will be set on the output SVG group, removing the title from the ARIA accessibility tree.|

### Themes and Configuration

To create themes, new default values for many title properties can be set using a [config](../config) object.

## <a name="custom"></a>Custom Title Encodings

In addition to the customization parameters above, mark properties can be set for all title elements using the _encode_ parameter. The addressable elements are:

- `group` for the title [group](../marks/group) mark,
- `title` for the title [text](../marks/text) mark, and
- `subtitle` for the subtitle [text](../marks/text) mark.

Each element accepts a set of visual encoding directives grouped into `enter`, `update`, `exit`, _etc._ objects as described in the [Marks](../marks) documentation. Mark properties can be styled using standard [value references](../types/#Value).

In addition, each encode block may include a string-valued `name` property to assign a unique name to the mark set, a boolean-valued `interactive` property to enable input event handling, and a string-valued (or array-valued) `style` property to apply default property values. Unless otherwise specified, title elements use a default style of `"group-title"` and subtitle elements use a default style of `"group-subtitle"`.

The following example shows how to set custom color and font properties for title and subtitle text marks, and enable interactivity for the subtitle text:

{: .suppress-error}
```json
"title": {
  "text": "Title Text",
  "subtitle": "Subtitle Text",
  "encode": {
    "title": {
      "enter": {
        "fill": {"value": "purple"}
      }
    },
    "subtitle": {
      "interactive": true,
      "update": {
        "fontStyle": {"value": "italic"}
      },
      "hover": {
        "fontStyle": {"value": "normal"}
      }
    }
  }
}
```

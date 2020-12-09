## General Mark Properties

| Property          | Type                          | Description  |
| :---------------- | :---------------------------: | :------------|
| x                 | {% include type t="Number" %} | The primary x-coordinate in pixels.|
| x2                | {% include type t="Number" %} | The secondary x-coordinate in pixels.|
| xc                | {% include type t="Number" %} | The center x-coordinate. Incompatible with `x` and `x2`.|
| width             | {% include type t="Number" %} | The width of the mark in pixels, if supported.|
| y                 | {% include type t="Number" %} | The primary y-coordinate in pixels.|
| y2                | {% include type t="Number" %} | The secondary y-coordinate in pixels.|
| yc                | {% include type t="Number" %} | The center y-coordinate. Incompatible with `y` and `y2`.|
| height            | {% include type t="Number" %} | The height of the mark in pixels, if supported.|
| opacity           | {% include type t="Number" %} | The mark opacity from 0 (transparent) to 1 (opaque).|
| fill              | {% include type t="Color" %}  | The fill color.|
| fillOpacity       | {% include type t="Number" %} | The fill opacity from 0 (transparent) to 1 (opaque).|
| stroke            | {% include type t="Color" %}  | The stroke color.|
| strokeOpacity     | {% include type t="Number" %} | The stroke opacity from 0 (transparent) to 1 (opaque).|
| strokeWidth       | {% include type t="Number" %} | The stroke width in pixels.|
| strokeCap         | {% include type t="String" %} | The stroke cap for line ending style. One of `butt` (default), `round` or `square`.|
| strokeDash        | {% include type t="Number[]" %} | An array of [stroke, space] lengths for creating dashed or dotted lines.|
| strokeDashOffset  | {% include type t="Number" %} | The pixel offset at which to start the stroke dash array.|
| strokeJoin        | {% include type t="String" %} | The stroke line join method. One of `miter` (default), `round` or `bevel`.|
| strokeMiterLimit  | {% include type t="Number" %} | The miter limit at which to bevel a line join.|
| blend             | {% include type t="String" %} | The color blend mode for drawing an item on its current background. Any valid [CSS mix-blend-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode) value except for `"normal"` can be used. The default value `null` maps to blend values of [normal](https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode) for SVG and [source-over](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) for Canvas.|
| cursor            | {% include type t="String" %} | The mouse cursor used over the mark. Any valid [CSS cursor type](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor#Values) can be used.|
| href              | {% include type t="URL" %}    | A URL to load upon mouse click. If defined, the mark acts as a hyperlink.|
| tooltip           | {% include type t="Any" %} | The tooltip text to show upon mouse hover. If the value is an object (other than a Date or an array), then all key-value pairs in the object will be shown in the tooltip, one per line (e.g., `"key1: value1\nkey2: value2"`). Array values will be shown in brackets `[value1, value2, ...]`.  Other values will be coerced to strings. Nested object values will _not_ be recursively printed.|
| zindex            | {% include type t="Number" %} | An integer z-index indicating the layering order of sibling mark items. The default value is `0`. Higher values (`1`) will cause marks to be drawn on top of those with lower z-index values. Setting the z-index as an encoding property only affects ordering among sibling mark items; it will not change the layering relative to other mark definitions. Unlike the mark-level _sort_ property, _zindex_ changes the rendering order only; it does not otherwise change mark item order (such as line or area point order). The most common use of _zindex_ is to ensure that a mark is drawn over its siblings when selected, such as by mouse hover.|

For marks that support width and height settings (including `rect` and `area`), the horizontal dimensions are determined (in order of precedence) by the _x_ and _x2_ properties, the _x_ and _width_ properties, the _x2_ and _width_ properties, or the _xc_ and _width_ properties. If all three of _x_, _x2_ and _width_ are specified, the _width_ value is ignored. The _y_, _y2_, _yc_ and _height_ properties are treated similarly.

For marks that do not support width or height (including `path` and `arc`) similar calculations are applied, but are only used to determine the mark's ultimate _x_ and _y_ position. The _width_ property may affect the final _x_ position, but otherwise is not visualized.

When using multiple spatial properties along the same dimension (_x_ and _x2_, or _y_ and _y2_), the properties **must** be specified in the same encoding set; for example, all within `"enter": {...}` or all within `"update": {...}`. Dividing the properties across encoding sets can cause unexpected behavior.

### Accessibility Properties {% include tag ver="5.11" %}

Accessibility properties are used to determine [ARIA (Accessible Rich Internet Applications) attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) when using Vega to render SVG output. Vega will automatically generate ARIA attributes for container SVG `<g>` elements for each mark definition; this can be configured using [mark-level accessibility properties](/docs/marks/#accessibility). Use the properties below in encode sets to add ARIA attributes for individual mark items.

| Property          | Type                          | Description  |
| :---------------- | :---------------------------: | :------------|
| aria              | {% include type t="Boolean" %}| A boolean flag (default `true`) indicating if ARIA attributes should be included (SVG output only). If `false`, the "aria-hidden" attribute will be set on the output SVG element, removing the mark item from the ARIA accessibility tree. |
| description       | {% include type t="String" %} | A text description of the mark item for ARIA accessibility (SVG output only). If specified, this property determines the ["aria-label" attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute). |

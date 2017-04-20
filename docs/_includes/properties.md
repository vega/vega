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
| cursor            | {% include type t="String" %} | The mouse cursor used over the mark. Any valid [CSS cursor type](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor#Values) can be used.|
| href              | {% include type t="URL" %}    | A URL to load upon mouse click. If defined, the mark acts as a hyperlink.|
| tooltip           | {% include type t="String" %} | The tooltip text to show upon mouse hover.|

For marks that support width and height settings (including `rect` and `area`), the horizontal dimensions are determined (in order of precedence) by the _x_ and _x2_ properties, the _x_ and _width_ properties, the _x2_ and _width_ properties, or the _xc_ and _width_ properties. If all three of _x_, _x2_ and _width_ are specified, the _width_ value is ignored. The _y_, _y2_, _yc_ and _height_ properties are treated similarly.

For marks that do not support width or height (including `path` and `arc`) similar calculations are applied, but are only used to determine the mark's ultimate _x_ and _y_ position. The _width_ property may affect the final _x_ position, but otherwise is not visualized.

When using multiple spatial properties along the same dimension (_x_ and _x2_, or _y_ and _y2_), the properties **must** be specified in the same encoding set; for example, all within `"enter": {...}` or all within `"update": {...}`. Dividing the properties across encoding sets can cause unexpected behavior.

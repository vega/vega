---
layout: transform
title: Wordcloud Transform
permalink: /docs/transforms/wordcloud/index.html
---

The **wordcloud** transform computes a word cloud layout, similar to [Wordle](http://www.wordle.net/). The wordcloud transform is intended for visualizing words or phrases with the [text mark type](../../marks/text). This transform uses [Jason Davies' wordcloud implementation](https://www.jasondavies.com/wordcloud/).

## Example

{% include embed spec="wordcloud" %}

In this example, word angles are randomly selected from the set [-rotate, 0, rotate].

## Transform Parameters

| Property            | Type                              | Description   |
| :------------------ | :-------------------------------: | :------------ |
| font                | {% include type t="String|Expr" %}| The font family to use for a word.|
| fontStyle           | {% include type t="String|Expr" %}| The font style to use for a word.|
| fontWeight          | {% include type t="String|Expr" %}| The font weight to use for a word.|
| fontSize            | {% include type t="Number|Expr" %}| The font size in pixels to use for a word.|
| fontSizeRange       | {% include type t="Number[]" %}   | The range of font sizes to use for the words. If the range is specified and the _fontSize_ is not a numeric constant, the _fontSize_ values will automatically be scaled to lie in the range according to a square root scale.|
| padding             | {% include type t="Number|Expr" %}| The padding in pixels to place around a word.|
| rotate              | {% include type t="Number|Expr" %}| The angle in degrees to use for a word.|
| text                | {% include type t="Field" %}      | The data field with the word text.|
| spiral              | {% include type t="String" %}     | The spiral layout method used to place words. One of `archimedean` (the default) or `rectangular`.|
| as                  | {% include type t="String[]" %}   | The output fields written by the transform. The default is `["x", "y", "font", "fontSize", "fontStyle", "fontWeight", "angle"]`|

**Note:** The wordcloud layout requires that text marks have an _align_ value of `"center"` and a _baseline_ value of `"alphabetic"`. If other settings are used, the text positioning will be inaccurate.

## Usage

```json
{
  "type": "wordcloud",
  "size": [{"signal": "width"}, {"signal": "height"}],
  "text": {"field": "text"},
  "font": "Helvetica Neue",
  "fontSize": {"field": "count"},
  "fontWeight": {"field": "weight"},
  "fontSizeRange": [10, 56],
  "rotate": {"field": "angle"},
  "padding": 2
}
```

Computes a wordcloud layout using the full width and height of the view. The _fontSize_, _fontWeight_ and _rotate_ parameters are drawn directly from data fields. A _fontSizeRange_ of `[10, 56]` is used to scale the _fontSize_ values. The results are then written to the default output fields.

---
layout: transform
title: Label Transform
permalink: /docs/transforms/label/index.html
---

The **label** transform {% include tag ver="5.16" %} positions text marks so that they do not overlap with each other or with other marks in the chart. The label transform should be applied to a [`text` mark](../../marks/text) whose input data is the *base mark* to label. That is, the `text` mark labels should derive from another mark through [reactive geometry](../../marks/#reactivegeom). To label individual line or area marks (rather than each point they contain), the base mark should be a [`group` mark](../../marks/group) containing lines or areas to label.

## Transform Parameters

| Property      | Type                  | Description |
| :------------ | :-------------------: | :---------- |
| size          | {% include type t="Number[]" %} | {% include required %} The size of the chart as a `[width, height]` array. |
| anchor        | {% include type t="String|String[]" %} | The list of anchor directions to test for each label relative to its base mark's bounding box. One of `"top-left"`, `"left"`, `"bottom-left"`, `"top"`, `"bottom"`, `"top-right"`, `"right"`, `"bottom-right"`, `"middle"` (default is all anchor points except `"middle"`). This parameter can be specified as either an array or a single anchor point. |
| avoidMarks    | {% include type t="String[]" %}     | A list of named marks that the labels should not overlap (default none). |
| avoidBaseMark | {% include type t="Boolean" %}     | A boolean flag (default `true`) specifying if labels should not overlap the base mark. |
| lineAnchor    | {% include type t="String" %}      | The anchor position of labels for line marks, where one line receives one label. One of `"start"` or `"end"` (the default). This property only applies when the base mark is a group mark containing line marks. |
| markIndex     | {% include type t="Number" %}      | The index of a mark in a group mark to use as the base mark (default `0`). When a group mark is used as base mark, *markIndex* is used to specify which mark in the group to label. This property only applies when the base mark is a group mark. |
| method        | {% include type t="String" %}      | The labeling method to use for area marks. One of `'floodfill'`, `'reduced-search'`, and `'naive'` (default). This property only applies when the base mark is a group mark containing area marks. |
| offset        | {% include type t="Number|Number[]" %} | A list of label offsets (in pixels) for each anchor direction, relative to the base mark bounding box (defaults to `1` for all anchors). This property can be specified as a single number to indicate a constant offset. |
| padding       | {% include type t="Number" %}   | The padding in pixels (default `0`) by which a label may extend past the chart bounding box. |
| sort          | {% include type t="Field" %}    | A field indicating the order in which labels should be placed, in ascending order. |
| as            | {% include type t="String[]" %}     | The output fields written by the transform. The default is `['x', 'y', 'opacity', 'align', 'baseline']`. |

## Usage

The following excerpt from the [Labeled Scatter Plot example](../../../examples/labeled-scatter-plot) applies a label transform to a `text` mark whose input data is the `symbol` mark named `"points"`. In addition, the *avoidMarks* parameter is used to instruct the labeler to also avoid overlapping the `line` mark named `"trend"`.

```json
{
  "marks": [
    {
      "name": "points",
      "type": "symbol",
      "from": {"data": "movies"},
      "encode": {
        "enter": {
          "x": {"scale": "x", "field": "Rotten Tomatoes Rating"},
          "y": {"scale": "y", "field": "IMDB Rating"},
          "size": {"value": 25},
          "fillOpacity": {"value": 0.5}
        }
      }
    },
    {
      "name": "trend",
      "type": "line",
      "from": {"data": "fit"},
      "encode": {
        "enter": {
          "x": {"scale": "x", "field": "u"},
          "y": {"scale": "y", "field": "v"},
          "stroke": {"value": "firebrick"}
        }
      }
    },
    {
      "type": "text",
      "from": {"data": "points"},
      "encode": {
        "enter": {
          "text": {"field": "datum.Title"},
          "fontSize": {"value": 8}
        }
      },
      "transform": [
        {
          "type": "label",
          "avoidMarks": ["trend"],
          "anchor": ["top", "bottom", "right", "left"],
          "offset": [1],
          "size": {"signal": "[width + 60, height]"}
        }
      ]
    }
  ]
}
```
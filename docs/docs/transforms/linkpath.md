---
layout: transform
title: LinkPath Transform
permalink: /docs/transforms/linkpath/index.html
---

The **linkpath** transform is used to route a visual link between two nodes. The most common use case is to draw edges in a tree or network layout. By default links are simply straight lines between source and target nodes; however, with additional shape and orientation information, a variety of link paths can be expressed. This transform writes one property to each datum, providing an [SVG path string](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) for the link path.

## Example

{% include embed spec="linkpath" %}

## Transform Parameters

| Property | Type                           | Description   |
| :------- | :----------------------------: | :------------ |
| sourceX  | {% include type t="Field" %}   | The data field for the source x-coordinate. The default is `source.x`.|
| sourceY  | {% include type t="Field" %}   | The data field for the source y-coordinate. The default is `source.y`.|
| targetX  | {% include type t="Field" %}   | The data field for the target x-coordinate. The default is `target.x`.|
| targetY  | {% include type t="Field" %}   | The data field for the target y-coordinate. The default is `target.y`.|
| orient   | {% include type t="String" %}  | The orientation of the link path. One of `vertical` (default), `horizontal` or `radial`. If a `radial` orientation is specified, x and y coordinate parameters will instead be interpreted as an angle (in radians) and radius, respectively.|
| shape    | {% include type t="String" %}  | The shape of the link path. One of `line` (default), `arc`, `curve`, `diagonal`, or `orthogonal`.|
| as       | {% include type t="String" %}  | The output field for the link path. The default is `"path"`.|


## Usage

```json
{"type": "linkpath"}
```

Computes straight-line link paths using the default source and target coordinate fields. Writes the result to the `path` field.

```json
{
  "type": "linkpath",
  "orient": "radial",
  "sourceX": "source.angle",
  "sourceY": "source.radius",
  "targetX": "target.angle",
  "targetY": "target.radius",
  "shape": "orthogonal",
  "as": "linkpath"
}
```

Computes link paths in polar coordinates (`"orient": "radial"`) using the provided source and target coordinate fields. Link paths are routed along `orthogonal` lines, as in a cluster plot or dendrogram. Writes the result to the `linkpath` field.

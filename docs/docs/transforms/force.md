---
layout: transform
title: Force Transform
permalink: /docs/transforms/force/index.html
---

The **force** transform computes a force-directed layout. Force-directed layout uses a model in which data objects act as charged particles (or _nodes_), optionally connected by a set of edges (or _links_). A set of forces are used to drive a physics simulation that determines the node positions. This transform uses the [d3-force](https://github.com/d3/d3-force) module.

To fix a node at a given position, you may set two special fields on a node object:

- `fx` - the node's fixed x-position
- `fy` - the node's fixed y-position

The force transform modifies the input node data _only_. It does not modify any properties of  link data. Instead, use a [lookup transform](../lookup) to join the node data with the link data. Then, use a transform such as [linkpath](../linkpath) to layout the links.

## Example

{% include embed spec="force" %}

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| static              | {% include type t="Boolean" %}  | Indicates if the simulation should be computed in batch to produce a static layout (`true`) or should be animated (`false`). The default is `false`.|
| restart             | {% include type t="Boolean" %}  | Indicates if the simulation should restart when node object fields are modified (default `false`).|
| iterations          | {% include type t="Number" %}   | The number of iterations to run the simulation when in _static_ mode (default `300`).|
| alpha               | {% include type t="Number" %}   | A value representing the current energy level or "temperature" of the simulation. Alpha values lie in the range [0, 1]. Internally, the simulation will decrease the alpha value over time, causing the magnitude of updates to diminish.|
| alphaMin            |{% include type t="Number" %}   | The minimum amount by which to lower the alpha value on each simulation iteration (default `0.001`).|
| alphaTarget         | {% include type t="Number" %}   | The target alpha value to which the simulation coverges (default `0`).|
| velocityDecay       | {% include type t="Number" %}   | The velocity decay factor is akin to atmospheric friction; after the application of any forces during an iteration, each node's velocity is multiplied by _1 - velocityDecay_ (default `0.4`).|
| forces              | {% include array t="[Force](#forces)" %} | An array of objects defining the forces to include in the simulation. See the [forces reference](#forces) for more.|
| as                  | {% include type t="String[]" %} | The output fields to which node positions and velocities are written. The default is `["x", "y", "vx", "vy"]`.|


<a name="forces"></a>

## Forces Reference

<a name="center" href="#center">#</a>
<b>center</b>

A force that pulls all nodes toward a shared [x, y] center point.

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| force               | {% include type t="String" %}  | The value `"center"`.|
| x                   | {% include type t="Number" %}  | The center x-coordinate.|
| y                   | {% include type t="Number" %}  | The center y-coordinate.|


<a name="collide" href="#collide">#</a>
<b>collide</b>

A collision detection force that pushes apart nodes whose circular radii overlap.

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| force               | {% include type t="String" %}  | The value `"collide"`.|
| radius              | {% include type t="Number|Expr" %} | The radius of the node.|
| strength            | {% include type t="Number" %}  | The relative strength of this force (default `0.7`).|
| iterations          | {% include type t="Number" %}  | The number of iterations to run collision detection (default `1`).|


<a name="nbody" href="#nbody">#</a>
<b>nbody</b>

An n-body force that causes nodes to either attract or repel each other.

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| force               | {% include type t="String" %}  | The value `"nbody"`.|
| strength            | {% include type t="Number" %}  | The relative strength of this force (default `-30`). Negative values cause nodes to repel, positive values to attract.|
| theta               | {% include type t="Number" %}  | Approximation parameter for aggregating more distance forces (default `0.9`).|
| distanceMin         | {% include type t="Number" %}  | The minimum distance over which this force acts. If two nodes are close than _distanceMin_, the exerted forces will be as if they are _distanceMin_ apart (default `1`).|
| distanceMax         | {% include type t="Number" %}  | The maximum distance over which this force acts. If two nodes exceed _distanceMax_, they will not exert forces on each other.|


<a name="link" href="#link">#</a>
<b>link</b>

Adds link constraints that causes nodes to be pushed apart towards a target separation distance. Link objects must be provided in a secondary data stream with data objects containing `source` and `target` fields to indicate nodes. If an _id_ field parameter is provided, it is used to related link objects and node objects. Otherwise, the source and target fields should provide indices into the array of node objects.

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| force               | {% include type t="String" %}  | The value `"link"`.|
| links               | {% include type t="Data" %}    | The data set containing the link data objects. Each link should contain `source` and `target` fields indicating the node objects.|
| id                  | {% include type t="Field" %}   | An optional data field for a node's unique identifier. If provided, the source and target fields of each link should use these values to indicate nodes.|
| distance            | {% include type t="Number|Expr" %} | The distance in pixels by which the link constraint should separate nodes (default `30`).|
| strength            | {% include type t="Number|Expr" %} | The relative strength of the link constraint.|
| iterations          | {% include type t="Number" %}  | The number of iterations to run link constraints (default `1`).|


<a name="x" href="#x">#</a>
<b>x</b>

Attracts nodes to a particular x-coordinate, on a per-node basis.

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| force               | {% include type t="String" %}  | The value `"x"`.|
| x                   | {% include type t="Field" %}   | The x-coordinate value that should attract the node.|
| strength            | {% include type t="Number" %}  | The relative strength of this force (default `0.1`).|


<a name="y" href="#y">#</a>
<b>y</b>

Attracts nodes to a particular y-coordinate, on a per-node basis.

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| force               | {% include type t="String" %}  | The value `"y"`.|
| y                   | {% include type t="Field" %}   | The y-coordinate value that should attract the node.|
| strength            | {% include type t="Number" %}  | The relative strength of this force (default `0.1`).|


## Usage

```json
{
  "type": "force",
  "forces": [
    {
      "force": "center",
      "x": {"signal": "width / 2"},
      "y": {"signal": "height / 2"}
    },
    {
      "force": "nbody",
      "strength": -10
    },
    {
      "force": "link",
      "links": "edges",
      "distance": 25
    },
    {
      "force": "collide",
      "radius": 10
    }
  ]
}
```

Perform force-directed layout of a network. The layout is centered in the middle of the view, nodes repel each other, and a data set `edges` defines link constraints with a 25 pixel distance. Finally, collision detection is performend on nodes with a radius of 10 pixels.

```json
{
  "type": "force",
  "static": true,
  "forces": [
    {
      "force": "x",
      "x": "xfocus"
    },
    {
      "force": "y",
      "y": "yfocus"
    },
    {
      "force": "collide",
      "radius": {"field": "radius"}
    }
  ]
}
```

Compute a beeswarm layout of nodes. Each node is attracted to an [x, y] coordinate given by the `xfocus` and `yfocus` fields. Collision detection is performed, using the `radius` data field of each node to determine the radius.

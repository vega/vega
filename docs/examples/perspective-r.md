---
layout: example
title: Perspective R Example
permalink: /examples/perspective-r/index.html
spec: perspective-r
image: /examples/img/perspective-r.png
---

This is the emulation of R [persp method](https://www.rdocumentation.org/packages/graphics/versions/3.6.2/topics/persp) implemented by [@mtiberghien](https://github.com/mtiberghien) in Vega. Change the curve `equation` and watch its visualization. You can also change the color `scheme` and display or hide `axes`. In the specification code, you can configure the range and the number of `x` and `y` points using `x_sequence` and `y_sequence` signals. The `z` point is calculated as an expression in the data table named `source`.Like in R, you can use `expand` to scale the `z` axis. Modifying `theta` and `phi` will rotate the visualization (this can also be achieved dragging the mouse). The spec also contains two data tables with 3D data: `volcano_source` and `weather_seattle_source`. You can try to change the `source` attribute of table `id_source` in the spec code to watch the [the volcano](../volcano-contours) or [the seattle weather heatmap](../heatmap) as a 3D matrix.

You can learn how the declarative 3D engine was created in [this tutorial](https://observablehq.com/@mathiastiberghien/how-to-create-a-3d-engine-from-scratch-using-vega).

Here's an example of integration in a notebook using [altair](https://colab.research.google.com/drive/1DZJm3KfgyhqCtybQ6euUcVEHKW7KYdEv?usp=sharing).

{% include example spec=page.spec %}

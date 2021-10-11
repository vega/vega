---
layout: example
title: Perspective R Example
permalink: /examples/perspective_r/index.html
spec: perspective_r
image: /examples/img/perspective_r.png
---

This is the emulation of R [persp method](https://www.rdocumentation.org/packages/graphics/versions/3.6.2/topics/persp) implemented by [@mtiberghien](https://github.com/mtiberghien) in Vega. Change the curve `equation` and watch its visualization. You can also change the color `scheme` and display or hide `axes` and `grid`. In the specification code, you can configure the range and the number of `x` and `y` points using `x_sequence` and `y_sequence` signals. The `z` point is calculated as an expression in the data table named `z_matrix`.Like in R, you can use `expand` to scale the `z` axis. Modifying `theta` and `phi` will rotate the visualization (this can also be achieved dragging the mouse).

You can learn how the declarative 3D engine was created in [this tutorial](https://observablehq.com/@mathiastiberghien/how-to-create-a-3d-engine-from-scratch-using-vega).

{% include example spec=page.spec %}

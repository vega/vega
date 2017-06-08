---
layout: home
menu: home
title: A Visualization Grammar
---

{:.lead}
**Vega** is a _visualization grammar_, a declarative language for creating, saving, and sharing interactive visualization designs. With Vega, you can describe the visual appearance and interactive behavior of a visualization in a JSON format, and generate web-based views using Canvas or SVG.

{:.lead-buttons .float-right}
[Version {{ site.data.versions.vega }}](https://github.com/vega/vega/releases/tag/v{{ site.data.versions.vega }})

Vega provides basic building blocks for a wide variety of visualization designs: [data loading](docs/data) and [transformation](docs/transforms), [scales](docs/scales), [map projections](docs/projections), [axes](docs/axes), [legends](docs/legends), and [graphical marks](docs/marks) such as rectangles, lines, plotting symbols, _etc_. Interaction techniques can be specified using [reactive signals](docs/signals) that dynamically modify a visualization in response to [input event streams](docs/event-streams).

A Vega _specification_ defines an interactive visualization in a [JSON](http://en.wikipedia.org/wiki/JSON) format. Specifications are parsed by Vega's JavaScript _runtime_ to generate both static images or interactive web-based views. Vega provides a convenient representation for computational generation of visualizations, and can serve as a foundation for new APIs and visual analysis tools.

To get started with Vega, take a look at the [tutorials](tutorials), [example gallery](examples), and [usage guide](usage), or read [about the project's goals](about). To create common statistical graphics in a more concise form, check out [Vega-Lite](https://vega.github.io/vega-lite), a higher-level language built on top of Vega.

Need help? Join the [Vega mailing list](https://groups.google.com/forum/#!forum/vega-js).

---
layout: page
title: Usage
menu: usage
permalink: /usage/index.html
---

Vega can be deployed for interactive visualizations within a web browser, or to render static PNG and SVG images server-side. This page describes the various means of deployment and use.

## <a name="reference"></a>Usage Reference

- [Web Deployment](#web)
  - [Import Vega JavaScript](#import)
  - [Using the Vega View API](#view)
  - [Using the Vega-Embed Module](#embed)
  - [Supporting Internet Explorer](#ie)
- [Command Line Utilities](#cli)
- [Server-Side Deployment](#node)


## <a name="web"></a>Web Deployment

To deploy Vega on the web, first [import](#import) the requisite JavaScript libraries. Then, use the [Vega View API](#view) or the convenient [Vega-Embed](#embed) helper module to parse Vega specifications and add interactive visualizations to a web page.

Try Vega with Vega-Embed online and publish your own chart by forking [our example Block](https://bl.ocks.org/domoritz/cd636b15fa0e187b51b73fc60b4d3014).

### <a name="import"></a>Import Vega JavaScript

To use Vega on a web page you first need to load the Vega JavaScript files. The simplest option is to import the complete Vega bundle. Load `vega.min.js` for deployment, and use `vega.js` for easier debugging.

```html
<head>
  <script src="https://vega.github.io/vega/vega.min.js"></script>
</head>
```

**Using Vega and D3 together.** The full `vega.js` file bundles up all dependencies, including [d3](https://d3js.org) modules. If you plan to independently use d3.js on your page, you can use a smaller Vega bundle that excludes redundant d3 files. Import d3 first, then import the smaller `vega-core.min.js` file to reduce the total file size.

```html
<head>
  <script src="https://d3js.org/d3.v4.min.js"></script>
  <script src="https://vega.github.io/vega/vega-core.min.js"></script>
</head>
```

**Loading Vega from a CDN.** While the examples here load files from the official Vega web site, for production deployments you will likely want to serve your own files or use a [content delivery network (CDN)](https://en.wikipedia.org/wiki/Content_delivery_network). Vega releases are hosted on [jsDelivr](https://www.jsdelivr.com/package/npm/vega):

```html
<head>
  <script src="https://cdn.jsdelivr.net/npm/vega@{{ site.data.versions.vega }}"></script>
</head>
```

If you have already imported d3 and want to use a smaller Vega bundle without d3, load `vega-core`.

```html
<head>
  <script src="https://cdn.jsdelivr.net/npm/d3@{{ site.data.versions.d3 }}"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega@{{ site.data.versions.vega }}/build/vega-core.min.js"></script>
</head>
```

[Back to reference](#reference)


### <a name="embed"></a>Using the Vega-Embed Module

The [Vega-Embed](https://github.com/vega/vega-embed) module provides a convenient method for adding either Vega or Vega-Lite visualizations to a web page. This module will take care of steps such as loading specification files from a URL and generating views with standard configuration options. In addition, you can include accompanying links to export images and view source. For more, see the [Vega-Embed repository](https://github.com/vega/vega-embed).

```html
<head>
  <script src="https://cdn.jsdelivr.net/npm/vega@{{ site.data.versions.vega }}"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@{{ site.data.versions.vega-lite }}"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@{{ site.data.versions.vega-embed }}"></script>
</head>
<body>
  <div id="view"></div>
  <script>
    vegaEmbed(
      '#view',
      'https://vega.github.io/vega/examples/bar-chart.vg.json'
    );
  </script>
</body>
```

[Back to reference](#reference)


### <a name="view"></a>Using the Vega View API

Vega's [View component](../docs/api/view) takes a parsed specification and configuration options as input and sets up an interactive web component. The View API also provides methods for streaming data updates, exporting static images, and accessing internal data for debugging purposes. For more, see the [View component](../docs/api/view) documentation.

```html
<head>
  <script src="https://cdn.jsdelivr.net/npm/vega@{{ site.data.versions.vega }}"></script>
</head>
<body>
  <div id="view"></div>
  <script type="text/javascript">
    var view;

    vega.loader()
      .load('https://vega.github.io/vega/examples/bar-chart.vg.json')
      .then(function(data) { render(JSON.parse(data)); });

    function render(spec) {
      view = new vega.View(vega.parse(spec))
        .renderer('canvas')  // set renderer (canvas or svg)
        .initialize('#view') // initialize view within parent DOM container
        .hover()             // enable hover encode set processing
        .run();
    }
  </script>
</body>
```

Vega visualizations will be added to a parent DOM element. This element must be provided to the `initialize` method by passing a DOM object or a CSS selector string. **Note:** Any existing content within the parent element _will be removed_ upon view initialization.

[Back to reference](#reference)


### <a name="ie"></a>Supporting Internet Explorer or Older Browsers

Vega is intended to be used with [ES6](http://es6-features.org/)-compliant JavaScript runtimes. This includes all major modern browsers, including Firefox, Chrome, Safari, and Edge, and server-side using Node.js. To run Vega in older browsers, such as Internet Explorer 10 or 11, you can use a JavaScript compiler such as [Babel](https://babeljs.io/) to generate ES5-compliant code.

[Back to reference](#reference)


## <a name="cli"></a>Command Line Utilities

The `vega-cli` package includes three node.js-based command line utilities &ndash; `vg2pdf`, `vg2png`, and `vg2svg` &ndash; for rendering static visualization images. These commands render to PDF, PNG, or SVG files, respectively.

- **vg2pdf**: `vg2pdf [-b basedir] [-s scalefactor] [-seed randomSeed] vega_json_file [output_png_file]`
- **vg2png**: `vg2png [-b basedir] [-s scalefactor] [-seed randomSeed] vega_json_file [output_png_file]`
- **vg2svg**: `vg2svg [-b basedir] [-s scalefactor] [-h] [-seed randomSeed] vega_json_file [output_svg_file]`

If no output file is given, the resulting PNG or SVG data will be written to standard output, and so can be piped into other applications. The programs also accept the following (optional) parameters:

* __-b__, __--base__ - [String] A base directory to use for data and image loading. For web retrieval, use `-b http://host/data/`. For files, use `-b file:///dir/data/` (absolute path) or `-b data/` (relative path).
* __-s__, __--scale__ - [Number] [Default:1] For PNG output, a resolution scale factor.  For example, `-s 2` results in a doubling of the output resolution. For PDF or SVG, scales the output coordinate space.
* __-seed__, - [Number] Seed for random number generation. Allows for consistent output over random values.
* __-h__, __--header__ - [Flag] Includes XML header and DOCTYPE in SVG output (vg2svg only).

To install the command line utilities, you must install the `vega-cli` npm package. For example, `yarn global add vega-cli` or `npm install -g vega-cli` will install the utilities for global use. If you install the package locally, the commands are accessible via your node_modules folder (`./node_modules/bin/vg2png`). Note that the `vg2png` utility depends on the [node-canvas](https://github.com/Automattic/node-canvas) package. See below for more [information about Vega and node-canvas](#node-canvas).

### Examples

In the vega package, you can run the following from the command line if vega-cli is installed.

Render the bar chart example to a PNG file:

```
vg2png test/specs-valid/bar.vg.json bar.png
```

Render the bar chart example to an SVG file, including XML headers:

```
vg2svg -h test/specs-valid/bar.vg.json bar.svg
```

Render the choropleth example to a PNG file. A base directory is specified for loading data files:

```
vg2png -b test test/specs-valid/choropleth.vg.json > choropleth.png
```

Render the arc example to a PDF file:

```
vg2pdf test/specs-valid/arc.vg.json > arc.pdf
```

Render the bar chart example to a PNG file at double resolution:

```
vg2png -s 2 test/specs-valid/bar.vg.json bar.png
```

[Back to reference](#reference)


## <a name="node"></a>Server-Side Deployment using Node.js

To use Vega as a component within a larger project, first install it either directly (`yarn add vega` or `npm install vega`) or by including `"vega"` among the dependencies in your package.json file. In node.js JavaScript code, import Vega using `require('vega')`. Much like browser-based deployments, Node.js deployments leverage the [Vega View API](../docs/view). However, server-side View instances should use the renderer type `none` and provide no DOM element to the `initialize` method.

<a name="node-canvas"></a>To generate PNG images and accurately measure font metrics for text mark truncation, the [node-canvas package](https://github.com/Automattic/node-canvas) must be installed. The Vega library does not require node-canvas by default, so you must include it as an explicit dependency in your own project if you wish to use it.

However, be aware that some system configurations may run into errors while installing node-canvas. Please consult the [node-canvas documentation](https://github.com/Automattic/node-canvas/) if you experience installation issues.

### Example

```js
var vega = require('vega');

// create a new view instance for a given Vega JSON spec
var view = new vega.View(vega.parse(spec))
  .renderer('none')
  .initialize();

// generate a static SVG image
view.toSVG()
  .then(function(svg) {
    // process svg string
  })
  .catch(function(err) { console.error(err); });

// generate a static PNG image
view.toCanvas()
  .then(function(canvas) {
    // process node-canvas instance
    // for example, generate a PNG stream to write
    var stream = canvas.createPNGStream();
  })
  .catch(function(err) { console.error(err); });
```


[Back to reference](#reference)

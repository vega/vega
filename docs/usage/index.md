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

**Loading Vega from a CDN.** While the examples here load files from the official Vega web site, for production deployments you will likely want to serve your own files or use a [content delivery network (CDN)](https://en.wikipedia.org/wiki/Content_delivery_network). Vega releases are hosted on the [CloudFlare CDN](https://cdnjs.com/libraries/vega):

```html
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vega/{{ site.data.versions.vega }}/vega.min.js"></script>
</head>
```

[Back to reference](#reference)


### <a name="view"></a>Using the Vega View API

Vega's [View component](../docs/api/view) takes a parsed specification and configuration options as input and sets up an interactive web component. The View API also provides methods for streaming data updates, exporting static images, and accessing internal data for debugging purposes. For more, see the [View component](../docs/api/view) documentation.

```js
var view = new vega.View(vega.parse(vegaJSONSpec))
  .renderer('canvas')  // set renderer (canvas or svg)
  .initialize('#view') // initialize view within parent DOM container
  .hover()             // enable hover encode set processing
  .run();              // run the dataflow and render the view
```

Vega visualizations will be added to a parent DOM element. This element must be provided to the `initialize` method by passing a DOM object or a CSS selector string. **Note:** Any existing content within the parent element _will be removed_ upon view initialization.

[Back to reference](#reference)


### <a name="embed"></a>Using the Vega-Embed Module

The [Vega-Embed](https://github.com/vega/vega-embed) module provides a convenient method for adding either Vega or Vega-Lite visualizations to a web page. This module will take care of steps such as loading specification files from a URL and generating views with standard configuration options. In addition, you can include accompanying links to export images and view source. For more, see the [Vega-Embed repository](https://github.com/vega/vega-embed).

```html
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vega/{{ site.data.versions.vega }}/vega.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vega-lite/{{ site.data.versions.vega-lite }}/vega-lite.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vega-embed/{{ site.data.versions.vega-embed }}/vega-embed.js"></script>
</head>
<body>
<div id="view"></div>
<script>
  vega.embed('#view', 'https://vega.github.io/vega/examples/bar-chart.vg.json');
</script>
</body>
```

[Back to reference](#reference)


### <a name="ie"></a>Supporting Internet Explorer

Vega is compatible with Internet Explorer versions 10 and 11, with one notable caveat: Internet Explorer does not natively support the [ES6 Promise object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), which Vega uses for asynchronous tasks such as data and image loading. For Vega to work correctly, deployments intended to support Internet Explorer should include a [polyfill](https://en.wikipedia.org/wiki/Polyfill) that adds Promise support.

For example, one can use the [promise-polyfill](https://github.com/taylorhakes/promise-polyfill) library. Web pages should first import the polyfill script, then import Vega:

```html
<head>
  <script src="https://vega.github.io/vega/assets/promise.min.js"></script>
  <script src="https://vega.github.io/vega/vega.min.js"></script>
</head>
```

Note that a polyfill is necessary only for Internet Explorer support. Recent versions of other browsers &ndash; including Edge (Internet Explorer's successor), Chrome, Safari, Firefox and Opera &ndash; all have native Promise support.

[Back to reference](#reference)


## <a name="cli"></a>Command Line Utilities

Vega includes two node.js-based command line utilities &ndash; `vg2png` and `vg2svg` &ndash; for rendering static visualization images. These commands render to PNG or SVG images, respectively.

- **vg2png**: `vg2png [-b basedir] vega_json_file [output_png_file]`
- **vg2svg**: `vg2svg [-b basedir] [-h] vega_json_file [output_svg_file]`

If no output file is given, the resulting PNG or SVG data will be written to standard output, and so can be piped into other applications. The programs also accept the following (optional) parameters:

* __-b__, __--base__ - [String] A base directory to use for data and image loading. For web retrieval, use `-b http://host/data/`. For files, use `-b file:///dir/data/` (absolute path) or `-b data/` (relative path).
* __-h__, __--header__ - [Flag] Includes XML header and DOCTYPE in SVG output (vg2svg only).

Within the Vega project directories, you can use `./bin/vg2png` or `./bin/vg2svg`. If you import Vega using npm, the commands are accessible either locally (`./node_modules/bin/vg2png`) or globally (`vg2png`) depending on how you install the Vega package. The `vg2png` utility requires that the optional [node-canvas](https://github.com/Automattic/node-canvas) dependency is installed. See below for more [information about Vega and node-canvas](#node-canvas).

### Examples

In the top-level Vega directory, you can run the following from the command line. Be sure you have run `npm install` in the top-level Vega directory to insure all dependencies are available.

Render the bar chart example to a PNG file:

```
bin/vg2png spec/bar.vg.json bar.png
```

Render the bar chart example to an SVG file, including XML headers:

```
bin/vg2svg -h spec/bar.vg.json bar.svg
```

Render the choropleth example to a PNG file. A base directory is specified for loading data files:

```
bin/vg2png -b web/data/ spec/choropleth.vg.json > choropleth.svg
```

Render the arc example to SVG and pipe through svg2pdf (requires [svg2pdf](http://brewformulas.org/svg2pdf)):

```
bin/vg2svg spec/arc.vg.json | svg2pdf > arc.pdf
```

[Back to reference](#reference)


## <a name="node"></a>Server-Side Deployment using Node.js

To include Vega in a node project, first install it from the command line using npm (`npm install vega`) or by including `"vega"` among the installed dependencies in your package.json file. In your node.js JavaScript code, import Vega using `require('vega')`. Much like browser-based deployments, Node.js deployments leverage the [Vega View API](../docs/view). However, server-side View instances should use the renderer type `none` and provide no DOM element to the `initialize` method.

<a name="node-canvas"></a>To generate PNG images and accurately measure font metrics for text mark truncation, the [node-canvas project](https://github.com/Automattic/node-canvas) &ndash; an optional dependency of Vega &ndash; must be installed. However, be aware that some system configurations may initially run into errors while installing and compiling node-canvas. Please consult the [node-canvas documentation](https://github.com/Automattic/node-canvas/wiki/_pages) if installation fails. That said, in most cases Vega can be used without node-canvas to generate static SVG files.

### Example

```js
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

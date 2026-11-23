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
  - [Content Security Policy](#csp)
- [Command Line Utilities](#cli)
- [Server-Side Deployment](#node)


## <a name="web"></a>Web Deployment

To deploy Vega on the web, first [import](#import) the requisite JavaScript libraries. Then, use the [Vega View API](#view) or the convenient [Vega-Embed](#embed) helper module to parse Vega specifications and add interactive visualizations to a web page.

Try Vega with Vega-Embed online and publish your own chart by forking [our example Block](https://bl.ocks.org/domoritz/cd636b15fa0e187b51b73fc60b4d3014).

### <a name="import"></a>Import Vega JavaScript

To use Vega on a web page, import the Vega ES module. The simplest option is to import it from a CDN in a module script.

```html
<script type="module">
  import * as vega from 'https://cdn.jsdelivr.net/npm/vega@{{ site.data.versions.vega }}/+esm';
</script>
```

Vega releases are available as ES modules on [jsDelivr](https://www.jsdelivr.com/package/npm/vega). For production deployments, you can use a [content delivery network (CDN)](https://en.wikipedia.org/wiki/Content_delivery_network) as shown above, serve the module yourself, or install Vega from npm.

**Using Vega with a bundler.** If you use Vega with a bundler like [Rollup](https://rollupjs.org/), install Vega from npm and import it as a module:

```js
import * as vega from 'vega';
```

You can also import individual Vega packages when you only need part of the API. For example:

```js
import {View} from 'vega-view';
```


[Back to reference](#reference)


### <a name="embed"></a>Using the Vega-Embed Module

The [Vega-Embed](https://github.com/vega/vega-embed) module provides a convenient method for adding either Vega or Vega-Lite visualizations to a web page. This module will take care of steps such as loading specification files from a URL and generating views with standard configuration options. In addition, you can include accompanying links to export images and view source. For more, see the [Vega-Embed repository](https://github.com/vega/vega-embed).

```html
<body>
  <div id="view"></div>
  <script type="module">
    import embed from 'https://cdn.jsdelivr.net/npm/vega-embed@{{ site.data.versions.vega-embed }}/+esm';

    embed(
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
<body>
  <div id="view"></div>
  <script type="module">
    import * as vega from 'https://cdn.jsdelivr.net/npm/vega@{{ site.data.versions.vega }}/+esm';

    let view;

    fetch('https://vega.github.io/vega/examples/bar-chart.vg.json')
      .then(res => res.json())
      .then(spec => render(spec))
      .catch(err => console.error(err));

    function render(spec) {
      view = new vega.View(vega.parse(spec), {
        renderer:  'canvas',  // renderer (canvas or svg)
        container: '#view',   // parent DOM container
        hover:     true       // enable hover processing
      });
      return view.runAsync();
    }
  </script>
</body>
```

Vega visualizations will be added to a parent DOM container element. This element (either a DOM object or a unique CSS selector string) must be provided  as a View constructor option or an as argument to the View `initialize` method. **Note:** Any existing content within the parent container element _will be removed_ upon view initialization.

[Back to reference](#reference)

### <a name="csp"></a>Vega and Content Security Policy (CSP)

By default Vega is not compliant with standard [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP), as it uses the [Function constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function) to generate functions defined in the Vega expression language. However, Vega allows use of alternative expression evaluators that are CSP-compliant. For more, see the [expression interpreter](interpreter) usage documentation.

[Back to reference](#reference)


## <a name="cli"></a>Command Line Utilities

The `vega-cli` package includes three node.js-based command line utilities &ndash; `vg2pdf`, `vg2png`, and `vg2svg` &ndash; for rendering static visualization images. These commands render to PDF, PNG, or SVG files, respectively.

- **vg2pdf**: `vg2pdf [options] [input_vega_json_file] [output_pdf_file]`
- **vg2png**: `vg2png [options] [input_vega_json_file] [output_png_file]`
- **vg2svg**: `vg2svg [options] [input_vega_json_file] [output_svg_file]`

If no input Vega JSON file is given, the utilities will attempt to read the file from standard input. If no output file is given, the resulting PDF, PNG, or SVG data will be written to standard output, and so can be piped into other applications.

The programs also accept the following (optional) parameters:

* __-b__, __--base__ - [String] A base directory to use for data and image loading. For web retrieval, use `-b http://host/data/`. For files, use `-b data/` (relative path) or `-b file:///dir/data/` (absolute path).
* __-h__, __--header__ - [Flag] Includes XML header and DOCTYPE in SVG output (vg2svg only).
* __-s__, __--scale__ - [Number] [Default:1] A resolution scale factor. For example, `-s 2` results in a doubling of the output resolution. For PDF or SVG, scales the output coordinate space.
* __-seed__, - [Number] Seed for random number generation. Allows for consistent output over random values. Internally replaces `Math.random` with a [linear congruential generator](../docs/api/statistics/#randomLCG).
* __-c__, __--config__, - [String] Provide a [Vega config object](https://vega.github.io/vega/docs/config/). A file path string to a JSON file or .js file that exports an object.
* __-f__, __--format__, - [String] Set the [number format locale](https://vega.github.io/vega/docs/api/locale/#formatLocale). A file path string to a JSON file or .js file that exports an object.
* __-t__, __--timeFormat__, - [String] Set [data/time format locale](https://vega.github.io/vega/docs/api/locale/#timeFormatLocale). A file path string to a JSON file or .js file that exports an object.
* __-l__, __--loglevel__ - [String] Level of log messages written to standard error output. One of `error`, `warn` (default), `info`, or `debug`.
* __--help__ - [Flag] Print usage help to the console.

To install the command line utilities, you must install the `vega-cli` npm package. For example, `yarn global add vega-cli` or `npm install -g vega-cli` will install the utilities for global use. If you install the package locally, the commands are accessible via your node_modules folder (`./node_modules/bin/vg2png`). The command line utilities depend on the [node-canvas](https://github.com/Automattic/node-canvas) package. See below for more [information about Vega and node-canvas](#node-canvas).

All errors and logging message will be written to standard error output (`stderr`). To create a log file, pipe the stderr output to the desired file. For example: `vg2pdf ...arguments 2> vg2pdf.log`.

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

Render the arc example as a PDF, piped to a file via standard output:

```
vg2pdf test/specs-valid/arc.vg.json > arc.pdf
```

Render the choropleth example to a PNG file. A base directory is specified for loading data files:

```
vg2png -b test test/specs-valid/choropleth.vg.json > choropleth.png
```

Render the bar chart example to a PNG file at double resolution:

```
vg2png -s 2 test/specs-valid/bar.vg.json bar.png
```

[Back to reference](#reference)


## <a name="node"></a>Server-Side Deployment using Node.js

To use Vega as a component within a larger project, first install it either directly (`yarn add vega` or `npm install vega`) or by including `"vega"` among the dependencies in your package.json file. In node.js JavaScript code, import Vega using `require('vega')`. Much like browser-based deployments, Node.js deployments leverage the [Vega View API](../docs/api/view). However, server-side View instances should use the renderer type `none` and provide no DOM element to the `initialize` method.

<a name="node-canvas"></a>To generate PNG images and accurately measure font metrics for text mark truncation, the [node-canvas package](https://github.com/Automattic/node-canvas) must be installed. The vega package does not require node-canvas by default, so you must include it as an explicit dependency in your own project if you wish to use it. The vega-cli package, on the other hand, _does_ include node-canvas as an explicit dependency.

Occasionally some system configurations may run into errors while installing node-canvas. Please consult the [node-canvas documentation](https://github.com/Automattic/node-canvas/) if you experience installation issues.

### Example

```js
var vega = require('vega');

// create a new view instance for a given Vega JSON spec
var view = new vega.View(vega.parse(spec), {renderer: 'none'});

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

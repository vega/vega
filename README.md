Vega: A Visualization Grammar
====
[![Build Status](https://travis-ci.org/vega/vega.svg)](https://travis-ci.org/vega/vega) 

**Vega** is a _visualization grammar_, a declarative format for creating and
saving interactive visualization designs. With Vega you can describe data 
visualizations in a JSON format, and generate interactive views using either 
HTML5 Canvas or SVG.

To learn more, [visit the wiki](https://github.com/vega/vega/wiki).

## The Vega Runtime

This repository contains the **vega-runtime** system, which parses Vega
specifications to produce interactive visualizations which run in the
browser using a scenegraph-based rendering system.

### Running Test Examples

To run the example tests, you will need to run a local web server. For 
example, if you have Python installed on your system, run `python -m 
SimpleHTTPServer 8000` in the top-level directory of this repository and then 
point your browser to 
[http://localhost:8000/examples/](http://localhost:8000/examples/).

### Build Process

To build the vega.js and vega.min.js files we use the 
[gulp](http://gulpjs.com/) build system along with 
[browserify](http://browserify.org/) to bundles the files.

1. Install gulp, as needed. Follow [step 1 on the Gulp Getting Started guide](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md).
2. Run `npm install` in the vega folder to install dependencies.
3. Run `gulp`.

## Vega Server-Side and Command Line Tools

Vega can also be run server-side using node.js. When running in "headless"
mode, Vega can be used to render specifications directly to PNG or SVG. In
addition to the summary below, [see the Headless Mode wiki
documentation](https://github.com/vega/vega/wiki/Headless-Mode) for more
information.

### Command Line Tools

Vega includes two command line tools for converting Vega JSON specifications
to rendered PNG or SVG:

* __vg2png__: `vg2png [-b basedir] vega_json_file [output_png_file]`
* __vg2svg__: `vg2svg [-b basedir] [-h] vega_json_file [output_svg_file]`

Within the Vega project directories, you can invoke these utilities using
`./bin/vg2png` or `./bin/vg2svg`. If you import Vega using npm, these commands
are accessible either locally (`node_modules/.bin/vg2png`) or globally
(`vg2png`) depending on how you install the Vega package.

### Using Vega in node.js Projects

To include Vega in a node project, first install it from the command line
using npm (`npm install vega`) or by including `"vega"` among the dependencies
in your package.json file. When running in node.js, Vega uses a "headless" 
rendering mode for generating visualizations outside the browser.

Vega: A Visualization Grammar
====

**Vega** is a _visualization grammar_, a declarative format for creating and
saving visualization designs. With Vega you can describe data visualizations
in a JSON format, and generate interactive views using either HTML5 Canvas or
SVG.

To learn more, [visit the wiki](https://github.com/trifacta/vega/wiki).

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

To build the vega-runtime system, run the makefile (`make`) within the top 
directory. Running the build process is only necessary if you want to modify 
the source code and rebuild vega.js.

The JavaScript build process depends on supporting node.js modules. First, 
make sure you have node.js and npm (Node Package Manager) installed and 
accessible from the command line. Run `make install` to install these modules 
into a local node_modules folder. The make install command will create the 
node_modules folder if it does not exist.

## Vega Server-Side and Command Line Tools

Vega can also be run server-side using node.js. When running in "headless"
mode, Vega can be used to render specifications directly to PNG or SVG. In
addition to the summary below, [see the Headless Mode wiki
documentation](https://github.com/trifacta/vega/wiki/Headless-Mode) for more
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
using npm (`npm install vega`) or by including `"vega"` (version 1.2.0 or
higher) among the dependencies in your package.json file. Then include Vega in
your node.js JavaScript code using `require("vega")`.

When running in node.js, Vega can use a "headless" rendering mode for
generating visualizations outside the browser. Internally, Vega uses a custom
view class (`vg.headless.View`) for headless rendering. However, most
applications can simply use the convenience method `vg.headless.render`.
Vega: A Visualization Grammar
====

**Vega** is a _visualization grammar_, a declarative format for creating and 
saving visualization designs. With Vega you can describe data visualizations in a JSON format, and generate interactive views using either HTML5 Canvas or SVG.

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
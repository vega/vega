# Vega: A Visualization Grammar

**Vega** is a *visualization grammar*, a declarative format for creating,
saving, and sharing interactive visualization designs.
With Vega you can describe data visualizations in a JSON format,
and generate interactive views using either HTML5 Canvas or SVG.

This repository houses ongoing **Vega 3.0** development. While still a work
in progress, Vega 3 has matured to a fully functional beta version with a
cleaner, more efficient, and more modular architecture. Vega 3 can now
reproduce all standard Vega 2 examples, and much more! [Contributions, feature
requests and bug reports](https://github.com/vega/vega/issues) are
most appreciated.

For documentation, see the [Vega website](https://vega.github.io/vega).
For a partial description of changes from Vega 2.x, please refer to the
[Vega 3 Porting Guide](https://vega.github.io/vega/docs/porting-guide/).
Additional API documentation for Vega 3 can be found in the associated
modules listed below.

Not ready to live on the edge? Looking for the latest stable release? Please
see [Vega 2.6](https://github.com/vega/vega/tree/v2.x). The Vega wiki
associated with this repo contains documentation for version 2.6.

## Basic Setup

For a basic setup allowing you to build Vega and run examples,
clone `https://github.com/vega/vega` and run `npm install`.

Once installation is complete, use `npm run test` to run tests and
`npm run build` to build output files.

This repo (`vega`) includes web-based demos within the `test` folder. To run
these, launch a local webserver in the top-level directory for the repo
(e.g., `python -m SimpleHTTPServer 8000` for Python 2,
`python -m http.server 8000` for Python 3) and then point your browser to
the right place (e.g., `http://localhost:8000/test/`).

## Development Setup

For a more advanced development setup in which you will be working on multiple
modules simultaneously, first clone the Vega 3 module repositories:

* https://github.com/vega/vega
* https://github.com/vega/vega-crossfilter
* https://github.com/vega/vega-dataflow
* https://github.com/vega/vega-encode
* https://github.com/vega/vega-expression
* https://github.com/vega/vega-force
* https://github.com/vega/vega-geo
* https://github.com/vega/vega-hierarchy
* https://github.com/vega/vega-loader
* https://github.com/vega/vega-parser
* https://github.com/vega/vega-runtime
* https://github.com/vega/vega-scale
* https://github.com/vega/vega-scenegraph
* https://github.com/vega/vega-statistics
* https://github.com/vega/vega-util
* https://github.com/vega/vega-view
* https://github.com/vega/vega-voronoi

Though not strictly required, we recommend using `npm link` to connect each
local copy of a repo with its 'vega-' dependencies. That way, any edits you
make in one repo will be immediately reflected within dependent repos,
accelerating testing.

For example, to link _vega-dataflow_ for use by other repos, do the following:
```
# register a link to vega-dataflow
cd vega-dataflow; npm link
# update vega-runtime to use the linked version of vega-dataflow
cd ../vega-runtime; npm link vega-dataflow
# update vega to use the linked version of vega-dataflow
cd ../vega; npm link vega-dataflow
```

Once links have been setup, you can use `npm install` as usual to gather all
remaining dependencies.

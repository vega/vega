# Vega: A Visualization Grammar

Vega 3.0 development.

## Development Environment Setup

New Vega modules are under active development and have not yet been published to npm. Here's how to set up a working Vega 3.0 development environment.

First, clone the following repositories under the uwdata organization:

* https://github.com/uwdata/vega
* https://github.com/uwdata/vega-crossfilter
* https://github.com/uwdata/vega-dataflow
* https://github.com/uwdata/vega-encode
* https://github.com/uwdata/vega-expression
* https://github.com/uwdata/vega-force
* https://github.com/uwdata/vega-geo
* https://github.com/uwdata/vega-hierarchy
* https://github.com/uwdata/vega-loader
* https://github.com/uwdata/vega-parser
* https://github.com/uwdata/vega-runtime
* https://github.com/uwdata/vega-scale
* https://github.com/uwdata/vega-scenegraph
* https://github.com/uwdata/vega-statistics
* https://github.com/uwdata/vega-util
* https://github.com/uwdata/vega-view
* https://github.com/uwdata/vega-voronoi

Next, use `npm link` to connect each repo with its 'vega-' dependencies. For example, to link _vega-dataflow_ for use by other repos, do the following:

```
cd vega-dataflow
npm link
cd ../vega-runtime
npm link vega-dataflow
cd ../vega
npm link vega-dataflow
```

Once the links have been setup, use `npm install` as usual to gather all remaining dependencies. Then, within each repo use `npm run test` to run tests and `npm run build` to build output files.

This repo (`vega`) includes web-based demos within the `web` folder. To run these, launch a local webserver in the top-level directory for the repo (e.g., `python -m SimpleHTTPServer 8000`) and then point your browser to right place (e.g., `http://localhost:8000/web`).

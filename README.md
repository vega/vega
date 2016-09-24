# Vega: A Visualization Grammar

Vega 3.0 development.

## Development Environment Setup

Here's how to set up a working Vega 3.0 development environment.

For a basic setup allowing you to build Vega and run examples, simply
clone `https://github.com/uwdata/vega` and run `npm install`.

For a more advanced development setup in which you will be working on multiple
modules simultaneously, first, clone all Vega 3 module repositories:

* https://github.com/uwdata/vega
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

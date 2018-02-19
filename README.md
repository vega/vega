# Vega: A Visualization Grammar

**Vega** is a *visualization grammar*, a declarative format for creating,
saving, and sharing interactive visualization designs.
With Vega you can describe data visualizations in a JSON format,
and generate interactive views using either HTML5 Canvas or SVG.

For documentation, tutorials, and examples, see the
[Vega website](https://vega.github.io/vega). For a description of changes
between Vega 2 and Vega 3, please refer to the
[Vega 3 Porting Guide](https://vega.github.io/vega/docs/porting-guide/).
Additional API documentation for Vega 3 can be found in the associated
modules listed below.

Are you using Vega in a web application built with a bundler such as
[Webpack](https://webpack.js.org/) or [Browserify](http://browserify.org/)?
If so, and you _do not need server-side rendering support_, you might
prefer using [vega-lib](https://github.com/vega/vega-lib) to include Vega
in your app.

## Basic Setup

For a basic setup allowing you to build Vega and run examples:

- Clone `https://github.com/vega/vega`.
- Run `yarn` to install dependencies. If you don't have yarn installed, see https://yarnpkg.com/en/docs/install.
- If you do not wish to install yarn, you can alternatively run `npm install`. However, you will not be guaranteed to have dependencies matching those of the current release.
- Once installation is complete, use `npm run test` to run tests and `npm run build` to build output files.

This repo (`vega`) includes web-based demos within the `test` folder. To run
these, launch a local webserver in the top-level directory for the repo
(e.g., `python -m SimpleHTTPServer 8000` for Python 2,
`python -m http.server 8000` for Python 3) and then point your browser to
the right place (e.g., `http://localhost:8000/test/`).

This repo also includes the website and documentation in the `docs` folder. To
launch it, run `bundle install` and `bundle exec jekyll serve` in the `docs`
folder. The last command launches a local webserver. Now, you can open
[`http://127.0.0.1:4000/vega/`](http://127.0.0.1:4000/vega/) to see the
website.

## Development Setup

For a more advanced development setup in which you will be working on multiple
modules simultaneously, first clone the relevant Vega 3 modules. Here is a
list of all Vega 3 repositories:

* https://github.com/vega/vega
* https://github.com/vega/vega-canvas
* https://github.com/vega/vega-crossfilter
* https://github.com/vega/vega-dataflow
* https://github.com/vega/vega-encode
* https://github.com/vega/vega-event-selector
* https://github.com/vega/vega-expression
* https://github.com/vega/vega-force
* https://github.com/vega/vega-geo
* https://github.com/vega/vega-hierarchy
* https://github.com/vega/vega-loader
* https://github.com/vega/vega-parser
* https://github.com/vega/vega-projection
* https://github.com/vega/vega-runtime
* https://github.com/vega/vega-scale
* https://github.com/vega/vega-scenegraph
* https://github.com/vega/vega-statistics
* https://github.com/vega/vega-transforms
* https://github.com/vega/vega-util
* https://github.com/vega/vega-view
* https://github.com/vega/vega-view-transforms
* https://github.com/vega/vega-voronoi
* https://github.com/vega/vega-wordcloud

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

# Contributing to Vega

If you find a bug in the code or a mistake in the [documentation](https://vega.github.io/vega/docs/), or if you would like to request a new feature, please [file an issue on GitHub](https://github.com/vega/vega/issues), or even better, submit a pull request.

For small fixes, please feel free to submit a pull request directly: don't worry about creating an issue first. For major changes, please discuss with us first. To ensure the discussion is visible and open for comments, please submit a new issue that we can tag with the discussion label.

If you would like to make multiple unrelated modifications, please separate them into separate pull requests for independent review and merging. If making significant inter-related modifications, please try to provide a logical sequence of piecewise commits rather than one giant commit spanning many files (as is feasible). Please also include appropriate test cases for ensuring correctness. Feel free to reach out for help or confirmation if you have questions on how to best proceed!

## Website and Documentation

The Vega website and documentation is in the `docs/` folder of this repository.
We use Jekyll and Github Pages to publish our documentation.
Each page in the documentation includes an "Edit this Page" link at the bottom that provides a shortcut for fixing errors and submitting them directly on GitHub.
To contribute more substantial changes to the website, you can submit a pull request that modifies
the files in `docs/`.

If contributing to the example gallery, include a corresponding thumbnail image in `docs/examples/img` that is either 360 pixels wide or 200 pixels tall. Please also add an entry for the example within an appropriate category in `docs/_data/examples.json`.

## Looking for a Task to Contribute

You can find [tasks with the "help-wanted" label in the issue tracker](https://github.com/vega/vega/labels/help-wanted). Please get in touch if you are planning to work on a major task.

# Development Setup

The Vega project consists of a number of modules, each with their own dedicated repository. The modular design is intended to enable reuse (for example, Vega's dataflow can be used independent of Vega's parsing and view components) and encourage appropriate separation of concerns.

Here is a list of all Vega repositories, by category:

* Core Modules
  * [vega](https://github.com/vega/vega): Top-level repository, including server-side rendering support. Includes the Vega website and documentation.
  * [vega-lib](https://github.com/vega/vega-lib): Library for web applications that do not require server-side rendering. Includes Vega's top-level test suite.
  * [vega-dataflow](https://github.com/vega/vega-dataflow): Core classes for Vega's reactive dataflow engine.
  * [vega-parser](https://github.com/vega/vega-parser): Parse Vega JSON specifications into dataflow graph descriptions. Includes guide generation logic for axes, legends, and titles, as well as extended expression functions.
  * [vega-runtime](https://github.com/vega/vega-runtime): Parse a dataflow graph description produced by vega-parser and instantiate a running dataflow.
  * [vega-scenegraph](https://github.com/vega/vega-scenegraph): Rendering and event handling for Canvas and SVG.
  * [vega-view](https://github.com/vega/vega-view): View component for creating and updating Vega visualizations.

* Dataflow Transforms
  * [vega-crossfilter](https://github.com/vega/vega-crossfilter): Dataflow transforms for indexed cross-filtering support.
  * [vega-encode](https://github.com/vega/vega-encode): Dataflow transforms for visual encoding, including basic layout and axis/legend data generation.
  * [vega-force](https://github.com/vega/vega-force): Dataflow transform for force-directed layout.
  * [vega-geo](https://github.com/vega/vega-geo): Dataflow transforms for projection and visualization of geographic data.
  * [vega-hierarchy](https://github.com/vega/vega-hierarchy): Dataflow transforms for generation and layout of hierarchical data.
  * [vega-transforms](https://github.com/vega/vega-transforms): Dataflow transforms for data processing, including binning, filtering, and aggregation.
  * [vega-view-transforms](https://github.com/vega/vega-view-transforms): Dataflow transforms for view-related operations, including scenegraph binding and bounds calculation.
  * [vega-voronoi](https://github.com/vega/vega-voronoi): Dataflow transform for computing Voronoi diagrams.
  * [vega-wordcloud](https://github.com/vega/vega-wordcloud): Dataflow transform for wordcloud layout.

* Utilities
  * [vega-canvas](https://github.com/vega/vega-canvas): Utility for creating a bitmap canvas.
  * [vega-event-selector](https://github.com/vega/vega-event-selector): Vega event selector parser.
  * [vega-expression](https://github.com/vega/vega-expression): Vega expression language parser and standard function library.
  * [vega-loader](https://github.com/vega/vega-loader): Load and parse external files.
  * [vega-projection](https://github.com/vega/vega-projection): Cartographic projections for geographic data.
  * [vega-scale](https://github.com/vega/vega-scale): Scale functions (linear, log, ordinal) and related methods.
  * [vega-statistics](https://github.com/vega/vega-statistics): Probability distributions and statistical methods.
  * [vega-util](https://github.com/vega/vega-util): General utility methods.

To setup a development environment in which you will be working on multiple modules simultaneously, first clone the relevant Vega modules to your local machine and run `yarn` (or `npm install`) in each to gather dependencies. Next, we recommend using `npm link` to connect the local Vega repositories for shared editing and development.

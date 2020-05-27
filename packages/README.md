# Vega Monorepo Packages

All Vega packages, by category:

- Core Modules
  - [vega](/packages/vega): Top-level package for building Vega bundles and the JSON schema. Includes a high-level test suite. Third party applications most likely want to import this package.
  - [vega-dataflow](/packages/vega-dataflow): Core classes for Vega's reactive dataflow engine.
  - [vega-functions](/packages/vega-functions): Functions and code generation support for the Vega expression language.
  - [vega-interpreter](/packages/vega-interpreter): Interpreter for Vega expression functions, for optional plug-in compliance with content security policy (CSP).
  - [vega-parser](/packages/vega-parser): Parse Vega JSON specifications into dataflow graph descriptions. Includes guide generation logic for axes, legends, and titles, as well as extended expression functions.
  - [vega-schema](/packages/vega-schema): Generates the Vega JSON schema definition.
  - [vega-runtime](/packages/vega-runtime): Parse a dataflow graph description produced by vega-parser and instantiate a running dataflow.
  - [vega-selections](/packages/vega-selections): Expression language functions for supporting Vega-Lite selections.
  - [vega-scenegraph](/packages/vega-scenegraph): Rendering and event handling for Canvas and SVG.
  - [vega-view](/packages/vega-view): View component for creating and updating Vega visualizations.
  - [vega-typings](/packages/vega-typings): Typescript type declarations for Vega.

- Dataflow Transforms
  - [vega-crossfilter](/packages/vega-crossfilter): Dataflow transforms for indexed cross-filtering support.
  - [vega-encode](/packages/vega-encode): Dataflow transforms for visual encoding, including basic layout and axis/legend data generation.
  - [vega-force](/packages/vega-force): Dataflow transform for force-directed layout.
  - [vega-geo](/packages/vega-geo): Dataflow transforms for projection and visualization of geographic data.
  - [vega-hierarchy](/packages/vega-hierarchy): Dataflow transforms for generation and layout of hierarchical data.
  - [vega-label](/packages/vega-label): Dataflow transform for text label layout.
  - [vega-regression](/packages/vega-regression): Dataflow transforms for fitting regression models.
  - [vega-transforms](/packages/vega-transforms): Dataflow transforms for data processing, including binning, filtering, and aggregation.
  - [vega-view-transforms](/packages/vega-view-transforms): Dataflow transforms for view-related operations, including scenegraph binding and bounds calculation.
  - [vega-voronoi](/packages/vega-voronoi): Dataflow transform for computing Voronoi diagrams.
  - [vega-wordcloud](/packages/vega-wordcloud): Dataflow transform for wordcloud layout.

- Utilities
  - [vega-canvas](/packages/vega-canvas): Utility for creating a bitmap canvas.
  - [vega-cli](/packages/vega-cli): Command line utilities for running Vega server-side.
  - [vega-event-selector](/packages/vega-event-selector): Vega event selector parser.
  - [vega-expression](/packages/vega-expression): Vega expression language parser and standard function library.
  - [vega-format](/packages/vega-format): String formatting utilities and locale management for number and date values.
  - [vega-loader](/packages/vega-loader): Load and parse external files.
  - [vega-projection](/packages/vega-projection): Cartographic projections for geographic data.
  - [vega-projection-extended](/packages/vega-projection-extended): Extended collection of cartographic projections.
  - [vega-scale](/packages/vega-scale): Scale functions (linear, log, ordinal) and related methods.
  - [vega-statistics](/packages/vega-statistics): Probability distributions and statistical utilities.
  - [vega-time](/packages/vega-time): Utility methods for dates and times.
  - [vega-util](/packages/vega-util): General utility methods.

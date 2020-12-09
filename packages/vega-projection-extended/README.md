# vega-projection-extended

Extended projections for cartographic mapping.

This package extends Vega's set of cartographic projections with those provided by the [d3-geo-projection](https://github.com/d3/d3-geo-projection) library. See the `index.js` file for the complete list of imported projections.

## Usage Instructions

To use this module in a web application, include the appropriate compiled JavaScript file as a script import on a web page. The library produces two output files:

1. `vega-projections.min.js` contains all extended projections plus required methods from the [d3-array](https://github.com/d3/d3-array) and [d3-geo](https://github.com/d3/d3-geo) libraries.
2. `vega-projections-core.min.js` contains the extended projections only and expects a stand-alone version of D3 to have already been imported.

If you are using the standard `vega.min.js` builds, include the following _after_ Vega has been imported:

```html
  <script src="vega-projections.min.js"></script>
```

If you are using a standalone version of D3 (for example, alongside `vega-core.min.js`), you can use the smaller file instead:

```html
  <script src="vega-projections-core.min.js"></script>
```

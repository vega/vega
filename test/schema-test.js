var tape = require('tape'),
    vega = require('../'), // eslint-disable-line no-unused-vars
    tv4 = require('tv4'),
    fs = require('fs'),
    schema = require('../build/vega-schema.json');

var dir = process.cwd() + '/test/spec/';

function validate(spec) {
  return tv4.validate(spec, schema);
}

tape('JSON schema validates correct specifications', function(test) {
  var specs = [
    "airports",
    "arc",
    "area",
    "bandsize",
    "bar",
    "bar-hover-label",
    "barley",
    "budget-forecasts",
    "chart",
    "choropleth",
    "crossfilter",
    "crossfilter-multi",
    "density",
    "dimpvis",
    "driving",
    "error",
    "falkensee",
    "force-network",
    "force-beeswarm",
    "gradient",
    "grouped-bar",
    "heatmap",
    "heatmap-lines",
    "histogram",
    "horizon",
    "images",
    "jobs",
    "legends",
    "lifelines",
    "map",
    "map-bind",
    "matrix-reorder",
    "movies-sort",
    "nested",
    "overview-detail",
    "panzoom",
    "parallel-coords",
    "playfair",
    "population",
    "shift-select",
    "splom-inner",
    "splom-outer",
    "stacked-area",
    "stacked-bar",
    "stocks-index",
    "tree-radial",
    "treemap",
    "violin-plot",
    "weather",
    "wordcloud"
  ];

  specs.forEach(function(file) {
    var spec = JSON.parse(fs.readFileSync(dir + file + '.vg.json')),
        pass = validate(spec);
    test.ok(pass, tv4.error);
  });

  test.end();
});
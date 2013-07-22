// cache pre-existing global values
var globals = ["vg", "d3", "topojson"],
    globalValues = {};

globals.forEach(function(g) {
  if (g in global) globalValues[g] = global[g];
});

// ensure availability of d3 and topojson in global namespace
// NOTE: will "pollute" namespace with jsdom window, etc
d3 = require("d3");
topojson = require("topojson");

// load and export vega
require("./vega");
module.exports = vg;

// restore pre-existing global values
globals.forEach(function(g) {
  if (g in globalValues) global[g] = globalValues[g];
  else delete global[g];
});
// cache pre-existing global values
var globals = ["vg", "d3", "topojson"],
    globalValues = {};

globals.forEach(function(g) {
  if (g in global) globalValues[g] = global[g];
});

// ensure availability of d3 and topojson in global namespace
d3 = require("d3");
topojson = require("topojson");
require("d3-geo-projection")(d3);

// load and export vega
require("./vega");
// check if we are running in node.js
vg.config.isNode = typeof process !== 'undefined' && process.title === 'node';
module.exports = vg;

// restore pre-existing global values
globals.forEach(function(g) {
  if (g in globalValues) global[g] = globalValues[g];
  else delete global[g];
});
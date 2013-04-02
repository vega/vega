var globals = ["vg"],
    globalValues = {};

globals.forEach(function(g) {
  if (g in global) globalValues[g] = global[g];
});

// Namespace pollution!
d3 = require("d3");

require("./vega");
module.exports = vg;

globals.forEach(function(g) {
  if (g in globalValues) global[g] = globalValues[g];
  else delete global[g];
});
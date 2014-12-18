// Define module using Universal Module Definition pattern
// https://github.com/umdjs/umd/blob/master/amdWeb.js

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // Support AMD. Register as an anonymous module.
    // NOTE: List all dependencies in AMD style
    define(['d3', 'topojson'], factory);
  } else {
    // No AMD. Set module as a global variable
    // NOTE: Pass dependencies to factory function
    // (assume that both d3 and topojson are also global.)
    var tj = (typeof topojson === 'undefined') ? null : topojson;
    vg = factory(d3, tj);
  }
}(
//NOTE: The dependencies are passed to this function
function (d3, topojson) {
//---------------------------------------------------
// BEGIN code for this module
//---------------------------------------------------

  var vg = {
    version:  "1.4.3", // semantic versioning
    d3:       d3,      // stash d3 for use in property functions
    topojson: topojson // stash topojson similarly
  };

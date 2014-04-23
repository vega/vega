// Define module using Universal Module Definition pattern
// https://github.com/umdjs/umd/blob/master/amdWeb.js

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // Support AMD. Register as an anonymous module.
    // EDIT: List all dependencies in AMD style
    define(['d3', 'topojson'], factory);
  } else {
    // No AMD. Set module as a global variable
    // EDIT: Pass dependencies to factory function
    root.vg = factory(root.d3, root.topojson);
  }
}(this,
//EDIT: The dependencies are passed to this function
function (d3, topojson) {
//---------------------------------------------------
// BEGIN code for this module
//---------------------------------------------------

var vg;

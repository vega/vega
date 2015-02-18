(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['d3', 'topojson'], factory);
  } else if(typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('d3'), require('topojson'));
  } else {
    // Browser globals (root is window)
    var tj = (typeof topojson === 'undefined') ? null : topojson;
    root.vg = factory(d3, tj);
  }
}(this, function (d3, topojson) {
    //almond, and your modules will be inlined here

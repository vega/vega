define(function(require, exports, module) {
  var vg = require('vega'),
      parseProperties = require('../src/parse/properties');

  return function compat() {
    vg.values = function(x) {
      return (vg.isObject(x) && !vg.isArray(x)) ? (x.data ? x.data() : x.values) : x;
    };
  }
})
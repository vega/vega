define(function(require, exports, module) {
  var parseMark = require('./mark');

  return function(model, spec, width, height) {
    return {
      type: "group",
      width: width,
      height: height,
      scales: spec.scales || [],
      // axes: spec.axes || [],
      // legends: spec.legends || [],
      marks: (spec.marks || []).map(function(m) { return parseMark(model, m); })
    };
  };
}) 
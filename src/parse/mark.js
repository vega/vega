define(function(require, exports, module) {
  var vg = require('vega'),
      parseProperties = require('./properties');

  return function parseMark(model, mark) {
    var props = mark.properties,
        group = mark.marks;

    // parse mark property definitions
    vg.keys(props).forEach(function(k) {
      props[k] = parseProperties(model, mark.type, props[k]);
    });

    // parse delay function
    if (mark.delay) {
      mark.delay = parseProperties(model, mark.type, {delay: mark.delay});
    }

    // recurse if group type
    if (group) {
      mark.marks = group.map(function(g) { return parseMark(model, g); });
    }
      
    return mark;
  };
})
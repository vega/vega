define(function(require, exports, module) {
  var util = require('../util/index'),
      parseProperties = require('./properties');

  return function parseMark(model, mark) {
    var props = mark.properties,
        group = mark.marks;

    // parse mark property definitions
    util.keys(props).forEach(function(k) {
      props[k] = parseProperties(model, mark.type, props[k]);
    });

    // parse delay function
    if (mark.delay) {
      mark.delay = parseProperties(model, mark.type, {delay: mark.delay});
    }

    // parse mark data definition
    if(mark.from) {
      // TODO: support mark.from.transform
      mark.from = mark.from.data;
    }

    // recurse if group type
    if (group) {
      mark.marks = group.map(function(g) { return parseMark(model, g); });
    }
      
    return mark;
  };
})
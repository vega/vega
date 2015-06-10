var d3 = require('d3');

var line = d3.svg.line()
 .x(function(d) { return d.x; })
 .y(function(d) { return d.y; });

module.exports = function(items) {
  var o = items[0];
  return line
      .interpolate(o.interpolate || null)
      .tension(o.tension || null)
      (items);
};

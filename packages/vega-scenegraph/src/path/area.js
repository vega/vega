var d3 = require('d3');

module.exports = function(items) {
  var o = items[0], area;
  
  if (o.orient === 'horizontal') {
    area = d3.svg.area()
      .y(function(d) { return d.y; })
      .x0(function(d) { return d.x; })
      .x1(function(d) { return d.x + d.width; });
  } else {
    area = d3.svg.area()
      .x(function(d) { return d.x; })
      .y1(function(d) { return d.y; })
      .y0(function(d) { return d.y + d.height; });
  }
  
  if (o.interpolate) area.interpolate(o.interpolate);
  if (o.tension != null) area.tension(o.tension);
  return area(items);
};

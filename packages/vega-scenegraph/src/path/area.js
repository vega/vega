var d3 = require('d3');

var x = function(d) { return d.x; },
    y = function(d) { return d.y; },
    dx = function(d) { return d.x + d.width; },
    dy = function(d) { return d.y + d.height; },
    areah = d3.svg.area().y(y).x0(x).x1(dx),
    areav = d3.svg.area().x(x).y1(y).y0(dy);

module.exports = function(items) {
  var o = items[0];
  return (o.orient === 'horizontal' ? areah : areav)
    .interpolate(o.interpolate || null)
    .tension(o.tension || null)
    (items);
};

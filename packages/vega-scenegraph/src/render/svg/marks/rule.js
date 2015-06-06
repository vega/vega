var util = require('./util');

function draw(o) {
  var x1 = o.x || 0,
      y1 = o.y || 0;
  this.setAttribute('x1', x1);
  this.setAttribute('y1', y1);
  this.setAttribute('x2', o.x2 != null ? o.x2 : x1);
  this.setAttribute('y2', o.y2 != null ? o.y2 : y1);
}

module.exports = {
  update: draw,
  draw:   util.draw('line', draw)
};

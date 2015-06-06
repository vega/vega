var util = require('./util');

function draw(o) {
  this.setAttribute('x', o.x || 0);
  this.setAttribute('y', o.y || 0);
  this.setAttribute('width', o.width || 0);
  this.setAttribute('height', o.height || 0);
}

module.exports = {
  update: draw,
  draw:   util.draw('rect', draw)
};

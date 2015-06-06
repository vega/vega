var util = require('./util');

function draw(o) {
  var x = o.x || 0,
      y = o.y || 0;
  this.setAttribute('transform', 'translate('+x+','+y+')');
  if (o.path != null) this.setAttribute('d', o.path);
}

module.exports = {
  update: draw,
  draw:   util.draw('path', draw)
};

var path = require('../../../util/svg').path.symbol,
    util = require('./util');

function draw(o) {
  var x = o.x || 0,
      y = o.y || 0;
  this.setAttribute('transform', 'translate(' + x + ',' + y +')');
  this.setAttribute('d', path(o));
}

module.exports = {
  update: draw,
  draw:   util.draw('path', draw)
};


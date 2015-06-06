var areah = require('../../../util/svg').path.areah,
    areav = require('../../../util/svg').path.areav,
    util = require('./util');

function draw(items) {
  if (!items.length) return;

  var o = items[0];
  var path = (o.orient === 'horizontal' ? areah : areav)
    .interpolate(o.interpolate || 'linear')
    .tension(o.tension == null ? 0.7 : o.tension);
  this.setAttribute("d", path(items));
}

module.exports = {
  update: draw,
  draw:   util.draw('path', draw, true),
  nested: true
};

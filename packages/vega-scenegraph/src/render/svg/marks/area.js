var areah = require('../../../util/svg').path.areah,
    areav = require('../../../util/svg').path.areav;

module.exports = {
  tag:    'path',
  nested: true,
  update: function(el, items) {
    if (!items.length) return;

    var o = items[0];
    var path = (o.orient === 'horizontal' ? areah : areav)
      .interpolate(o.interpolate || 'linear')
      .tension(o.tension == null ? 0.7 : o.tension);
    el.setAttribute("d", path(items));
  }
//  draw:   util.draw('path', draw, true)
};

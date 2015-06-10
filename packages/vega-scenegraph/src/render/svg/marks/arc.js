var path = require('../../../util/svg').path.arc;

module.exports = {
  tag:    'path',
  update: function(el, o) {
    var x = o.x || 0,
        y = o.y || 0;
    el.setAttribute('transform', 'translate('+x+','+y+')');
    el.setAttribute('d', path(o));
  }
//  draw:   util.draw('path', draw)
};

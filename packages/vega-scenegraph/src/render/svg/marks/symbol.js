var path = require('../../../util/svg').path.symbol;

module.exports = {
  tag:    'path',
  update: function draw(el, o) {
    var x = o.x || 0,
        y = o.y || 0;
    el.setAttribute('transform', 'translate(' + x + ',' + y +')');
    el.setAttribute('d', path(o));
  }
};


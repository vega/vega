var path = require('../../../util/svg').path.line;

module.exports = {
  tag:    'path',
  nested: true,
  update: function(el, items) {
    if (!items.length) return;
    var o = items[0];
    path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == null ? 0.7 : o.tension);
    el.setAttribute("d", path(items));
  }
};

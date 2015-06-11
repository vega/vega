var line = require('../util/svg').path.line;

module.exports = function(items) {
  var o = items[0];
  return line
    .interpolate(o.interpolate || 'linear')
    .tension(o.tension || 0.7)
    (items);
};

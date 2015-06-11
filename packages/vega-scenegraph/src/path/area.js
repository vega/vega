var path = require('../util/svg').path;

module.exports = function(items) {
  var o = items[0];
  return (o.orient === 'horizontal' ? path.areah : path.areav)
    .interpolate(o.interpolate || 'linear')
    .tension(o.tension || 0.7)
    (items);
};

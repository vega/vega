var draw = require('./util').draw;

function init(mark) {
  mark.draw = function(g, scene, index) {
    draw.call(this, g, scene, index, mark);
  };
  return mark;
}

module.exports = {
  arc:    init(require('./arc')),
  area:   init(require('./area')),
  group:  require('./group'),
  image:  init(require('./image')),
  line:   init(require('./line')),
  path:   init(require('./path')),
  rect:   init(require('./rect')),
  rule:   init(require('./rule')),
  symbol: init(require('./symbol')),
  text:   init(require('./text'))
};

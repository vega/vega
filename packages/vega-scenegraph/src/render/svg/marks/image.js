var dl = require('datalib'),
    util = require('./util');

function draw(o) {
  var x = o.x || 0,
      y = o.y || 0,
      w = o.width || (o.image && o.image.width) || 0,
      h = o.height || (o.image && o.image.height) || 0,
      url = dl.load.sanitizeUrl({url: o.url});
        // TODO dl.extend({url: o.url}, config.load));

  x = o.x - (o.align==='center' ? w/2 : (o.align==='right' ? w : 0));
  y = o.y - (o.baseline==='middle' ? h/2 : (o.baseline==='bottom' ? h : 0));

  if (url) {
    this.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
  }

  this.setAttribute('x', x);
  this.setAttribute('y', y);
  this.setAttribute('width', w);
  this.setAttribute('height', h);
}

module.exports = {
  update: draw,
  draw:   util.draw('image', draw)
};

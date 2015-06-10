var dl = require('datalib'),
    util = require('./util'),
    ImageLoader = require('../../../util/ImageLoader');

function draw(o) {
  var x = o.x || 0,
      y = o.y || 0,
      w = o.width || 0, // TODO? image loading to determine width/height
      h = o.height || 0,
      url = ImageLoader.imageURL(o.url);

  x = x - (o.align==='center' ? w/2 : (o.align==='right' ? w : 0));
  y = y - (o.baseline==='middle' ? h/2 : (o.baseline==='bottom' ? h : 0));

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

module.exports = {
  tag:    'image',
  update: function(el, o) {
    var x = o.x || 0,
        y = o.y || 0,
        w = o.width || 0, // TODO? image loading to determine width/height
        h = o.height || 0,
        url = this._loader.imageURL(o.url);

    x = x - (o.align==='center' ? w/2 : (o.align==='right' ? w : 0));
    y = y - (o.baseline==='middle' ? h/2 : (o.baseline==='bottom' ? h : 0));

    if (url) {
      el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
    }

    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('width', w);
    el.setAttribute('height', h);
  }
};

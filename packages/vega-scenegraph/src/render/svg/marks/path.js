module.exports = {
  tag:    'path',
  update: function draw(el, o) {
    var x = o.x || 0,
        y = o.y || 0;
    el.setAttribute('transform', 'translate('+x+','+y+')');
    if (o.path != null) el.setAttribute('d', o.path);
  }
};

var textAlign = require('../../../util/svg').textAlign,
    font = require('../../../util/font');

function update(el, o) {
  var x = o.x || 0,
      y = o.y || 0,
      a = o.angle || 0,
      r = o.radius || 0,
      align = textAlign[o.align] || 'start',
      offset = font.offset(o);

  if (r) {
    var t = (o.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  el.setAttribute('x', x + (o.dx || 0));
  el.setAttribute('y', y + (o.dy || 0) + offset);
  el.setAttribute('text-anchor', align);

  if (a) el.setAttribute('transform', 'rotate('+a+' '+x+','+y+')');
  else el.removeAttribute('transform');

  el.textContent = o.text;
  el.style.setProperty('font', font.string(o), null);
}

module.exports = {
  tag:    'text',
  update: update
};

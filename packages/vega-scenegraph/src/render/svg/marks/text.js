var textAlign = require('../../../util/svg').textAlign,
    textBaseline = require('../../../util/svg').textBaseline,
    fontString = require('../../../util/dom').fontString;

function update(el, o) {
  var x = o.x || 0,
      y = o.y || 0,
      a = o.angle || 0,
      r = o.radius || 0,
      align = textAlign[o.align] || 'start',
      base = textBaseline[o.baseline] || 'alphabetic';

  if (r) {
    var t = (o.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  el.setAttribute('x', x + (o.dx || 0));
  el.setAttribute('y', y + (o.dy || 0));
  el.setAttribute('text-anchor', align);
  el.setAttribute('alignment-baseline', base);

  if (a) el.setAttribute('transform', 'rotate('+a+' '+x+','+y+')');
  else el.removeAttribute('transform');

  el.textContent = o.text;
  el.style.setProperty('font', fontString(o), null);
}

module.exports = {
  tag:    'text',
  update: update
};

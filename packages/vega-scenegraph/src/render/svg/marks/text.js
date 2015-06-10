var textAlign = require('../../../util/svg').textAlign,
    fontString = require('../../../util/dom').fontString;

function update(el, o) {
  var x = o.x || 0,
      y = o.y || 0,
      dx = o.dx || 0,
      dy = o.dy || 0,
      a = o.angle || 0,
      r = o.radius || 0,
      align = textAlign[o.align || 'left'],
      base = o.baseline==='top' ? '.9em'
           : o.baseline==='middle' ? '.35em' : 0;

  if (r) {
    var t = (o.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  el.setAttribute('x', x + dx);
  el.setAttribute('y', y + dy);
  el.setAttribute('text-anchor', align);
  
  if (a) el.setAttribute('transform', 'rotate('+a+' '+x+','+y+')');
  else el.removeAttribute('transform');
  
  if (base) el.setAttribute('dy', base);
  else el.removeAttribute('dy');
  
  el.textContent = o.text;
  el.style.setProperty('font', fontString(o), null);
}

module.exports = {
  tag:    'text',
  update: update
};

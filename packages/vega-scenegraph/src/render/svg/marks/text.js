var util = require('./util'),
    svg = require('../../../util/svg'),
    fontString = require('../../../util/font-string');

function draw(o) {
  var x = o.x || 0,
      y = o.y || 0,
      dx = o.dx || 0,
      dy = o.dy || 0,
      a = o.angle || 0,
      r = o.radius || 0,
      align = svg.textAlign[o.align || 'left'],
      base = o.baseline==='top' ? '.9em'
           : o.baseline==='middle' ? '.35em' : 0;

  if (r) {
    var t = (o.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  this.setAttribute('x', x + dx);
  this.setAttribute('y', y + dy);
  this.setAttribute('text-anchor', align);
  
  if (a) this.setAttribute('transform', 'rotate('+a+' '+x+','+y+')');
  else this.removeAttribute('transform');
  
  if (base) this.setAttribute('dy', base);
  else this.removeAttribute('dy');
  
  this.textContent = o.text;
  this.style.setProperty('font', fontString(o), null);
}

module.exports = {
  update: draw,
  draw:   util.draw('text', draw)
};

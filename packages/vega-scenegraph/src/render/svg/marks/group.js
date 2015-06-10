var d3 = require('d3'),
    drawMark = require('./draw');

function draw(g, scene, index) {
  var renderer = this,
      p = drawMark.call(this, g, scene, index, groupMark),
      c = p.node().childNodes,
      i, n, j, m;

  for (i=0, n=c.length; i<n; ++i) {
    var datum = c[i].__data__,
        items = datum.items || [],
        legends = datum.legendItems || [],
        axes = datum.axisItems || [],
        sel = d3.select(c[i]),
        idx = 0;

    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer === 'back') {
        draw.call(renderer, sel, axes[j], idx++);
      }
    }
    for (j=0, m=items.length; j<m; ++j) {
      renderer.draw(sel, items[j], idx++);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer !== 'back') {
        draw.call(renderer, sel, axes[j], idx++);
      }
    }
    for (j=0, m=legends.length; j<m; ++j) {
      draw.call(renderer, sel, legends[j], idx++);
    }
  }
}

function update(el, o) {
  var x = o.x || 0,
      y = o.y || 0,
      id, c;

  el.setAttribute('transform', 'translate('+x+','+y+')');

  if (o.clip) {
    id = o.clip_id || (o.clip_id = 'clip' + this._defs.clip_id++);
    c = {
      width: o.width || 0,
      height: o.height || 0
    };
    this._defs.clipping[id] = c;
    el.setAttribute('clip-path', 'url(#'+id+')');
  }
  
  var bg = el.childNodes[0];
  var w = o.width || 0,
      h = o.height || 0;
  bg.setAttribute('width', w);
  bg.setAttribute('height', h);
}

var groupMark = module.exports = {
  tag:    'g',
  update: update,
  draw:   draw
};

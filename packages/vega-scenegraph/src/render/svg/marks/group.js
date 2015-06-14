var DOM = require('../../../util/dom'),
    drawMark = require('./draw');

function draw(el, scene, index) {
  var renderer = this,
      groups = scene.items,
      p = drawMark.call(this, el, scene, index, groupMark),
      i, n, j, m;

  for (i=0, n=groups.length; i<n; ++i) {
    var group = groups[i],
        items = group.items || [],
        legends = group.legendItems || [],
        axes = group.axisItems || [],
        g = p.childNodes[i],
        idx = 0;

    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer === 'back') {
        draw.call(renderer, g, axes[j], idx++);
      }
    }
    for (j=0, m=items.length; j<m; ++j) {
      renderer.draw(g, items[j], idx++);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer !== 'back') {
        draw.call(renderer, g, axes[j], idx++);
      }
    }
    for (j=0, m=legends.length; j<m; ++j) {
      draw.call(renderer, g, legends[j], idx++);
    }

    // remove any extraneous DOM elements
    j = 1 + items.length + legends.length + axes.length;
    DOM.clear(g, j);
  }
}

function update(el, o) {
  var w = o.width || 0,
      h = o.height || 0,
      cp = 'clip-path',
      id, c, bg;

  el.setAttribute('transform', 'translate(' + (o.x||0) + ',' + (o.y||0) + ')');

  if (o.clip) {
    id = o.clip_id || (o.clip_id = 'clip' + this._defs.clip_id++);
    c = this._defs.clipping[id] || (this._defs.clipping[id] = {id: id});
    c.width = w;
    c.height = h;
    el.setAttribute(cp, 'url(#'+id+')');
  } else if (el.hasAttribute(cp)) {
    id = el.getAttribute(cp).slice(5, -1);
    delete this._defs.clipping[id];
    el.removeAttribute(cp);
  }

  bg = el.childNodes[0];
  bg.setAttribute('width', w);
  bg.setAttribute('height', h);
}

var groupMark = module.exports = {
  tag:    'g',
  update: update,
  draw:   draw
};

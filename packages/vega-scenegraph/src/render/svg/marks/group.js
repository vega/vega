var DOM = require('../../../util/dom'),
    drawMark = require('./util').draw;

function draw(el, scene, index) {
  var p = drawMark.call(this, el, scene, index, groupMark);
  for (var i=0, n=scene.items.length; i<n; ++i) {
    recurse.call(this, p.childNodes[i], scene.items[i]);
  }
}

function recurse(el, group) {
  var items = group.items || [],
      legends = group.legendItems || [],
      axes = group.axisItems || [],
      idx = 0, j, m;

  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer === 'back') {
      draw.call(this, el, axes[j], idx++);
    }
  }
  for (j=0, m=items.length; j<m; ++j) {
    this.draw(el, items[j], idx++);
  }
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer !== 'back') {
      draw.call(this, el, axes[j], idx++);
    }
  }
  for (j=0, m=legends.length; j<m; ++j) {
    draw.call(this, el, legends[j], idx++);
  }

  // remove any extraneous DOM elements
  DOM.clear(el, 1 + idx);
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
    // remove expired clip path
    id = el.getAttribute(cp).slice(5, -1);
    delete this._defs.clipping[id];
    el.removeAttribute(cp);
  }

  bg = el.childNodes[0];
  bg.setAttribute('width', w);
  bg.setAttribute('height', h);
}

var groupMark = module.exports = {
  tag:     'g',
  recurse: recurse,
  update:  update,
  draw:    draw
};

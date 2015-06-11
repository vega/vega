var dl = require('datalib'),
    ns = require('../../../util/svg').metadata.xmlns,
    DOM = require('../../../util/dom');

module.exports = function(el, scene, index, mark) {
  var data = mark.nested ? [scene.items] : scene.items || [],
      events = scene.interactive === false ? 'none' : null,
      isGroup = (mark.tag === 'g'),
      p, i, n, c, d, bg, o;

  p = el.childNodes[index+1]; // +1 skips background rect
  if (!p) {
    p = DOM.childAt(el, index+1, 'g', ns);
    p.setAttribute('id', 'g' + (this._defs.group_id++));
    p.setAttribute('class', DOM.cssClass(scene));
  }
  if (!isGroup && events) {
    p.style.setProperty('pointer-events', events);
  }

  for (i=0, n=data.length; i<n; ++i) {
    c = p.childNodes[i];
    d = data[i];
    if (!c) {
      c = DOM.childAt(p, i, mark.tag, ns);
      c.__data__ = d;
      if (isGroup) {
        bg = DOM.childAt(c, 0, 'rect', ns);
        bg.setAttribute('class', 'background');
        bg.setAttribute('width', 0);
        bg.setAttribute('height', 0);
        bg.style.setProperty('pointer-events', events);
      } else {
        o = (dl.isArray(d) ? d[0] : d);
        if (o) o._svg = c;
      }
    }
    mark.update.call(this, c, d);
    this.style(isGroup ? c.childNodes[0] : c, d);
  }
  DOM.clearChildren(p, i);
  return p;
};

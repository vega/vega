var dl = require('datalib'),
    ns = require('../../../util/svg').metadata.xmlns,
    DOM = require('../../../util/dom');

module.exports = function(el, scene, index, mark) {
  var data = mark.nested ? [scene.items] : scene.items || [],
      events = scene.interactive === false ? 'none' : null,
      isGroup = (mark.tag === 'g'),
      className = DOM.cssClass(scene),
      p, i, n, c, d, bg, o;

  p = DOM.child(el, index+1, 'g', ns, className);
  p.setAttribute('class', className);
  if (!isGroup && events) {
    p.style.setProperty('pointer-events', events);
  }

  for (i=0, n=data.length; i<n; ++i) {
    c = p.childNodes[i];
    d = data[i];
    if (!c) {
      c = DOM.child(p, i, mark.tag, ns);
      c.__data__ = d;
      if (isGroup) {
        bg = DOM.child(c, 0, 'rect', ns, 'background');
        bg.setAttribute('width', 0);
        bg.setAttribute('height', 0);
        bg.style.setProperty('pointer-events', events);
        d._svg = bg;
      } else if ((o = dl.isArray(d) ? d[0] : d)) {
        o._svg = c;
      }
    }
    mark.update.call(this, c, d);
    this.style(isGroup ? c.childNodes[0] : c, d);
  }
  DOM.clear(p, i);
  return p;
};

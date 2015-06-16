var ns = require('../../../util/svg').metadata.xmlns,
    DOM = require('../../../util/dom');

function draw(el, scene, index, mark) {
  if (!this.isDirty(scene)) return;

  var items = mark.nested ? [scene.items] : scene.items || [],
      events = scene.interactive === false ? 'none' : null,
      isGroup = (mark.tag === 'g'),
      className = DOM.cssClass(scene),
      p, i, n, c, d;

  p = DOM.child(el, index+1, 'g', ns, className);
  p.setAttribute('class', className);
  scene._svg = p;
  if (!isGroup && events) {
    p.style.setProperty('pointer-events', events);
  }

  for (i=0, n=items.length; i<n; ++i) {
    if (this.isDirty(d = items[i])) {
      c = p.childNodes[i] || bind(p, mark, d, i);
      mark.update.call(this, c, d);
      this.style(c, d);
    }
  }
  DOM.clear(p, i);
  return p;
}

function bind(el, mark, item, index) {
  // create svg element, bind item data for D3 compatibility
  var node = DOM.child(el, index, mark.tag, ns);
  node.__data__ = item;
  // create background rect
  if (mark.tag === 'g') {
    DOM.child(node, 0, 'rect', ns, 'background');
  }
  // add pointer from scenegraph item to svg element
  if ((item = Array.isArray(item) ? item[0] : item)) {
    item._svg = node;
  }
  return node;
}

module.exports = {
  draw: draw,
  bind: bind
};

var ImageLoader = require('../../util/ImageLoader'),
    Renderer = require('../Renderer'),
    font = require('../../util/font'),
    DOM = require('../../util/dom'),
    SVG = require('../../util/svg'),
    ns = SVG.metadata.xmlns,
    marks = require('./marks');

var href = (typeof window !== 'undefined' ? window.location.href : '');

function SVGRenderer(loadConfig) {
  Renderer.call(this);
  this._loader = new ImageLoader(loadConfig);
  this._dirtyID = 0;
}

var base = Renderer.prototype;
var prototype = (SVGRenderer.prototype = Object.create(base));
prototype.constructor = SVGRenderer;

prototype.initialize = function(el, width, height, padding) {
  if (el) {
    this._svg = DOM.child(el, 0, 'svg', ns, 'marks');
    DOM.clear(el, 1);
    // set the svg root group
    this._root = DOM.child(this._svg, 0, 'g', ns);
    DOM.clear(this._svg, 1);
  }

  // create the svg definitions cache
  this._defs = {
    clip_id:  1,
    gradient: {},
    clipping: {}
  };

  // set background color if defined
  this.background(this._bgcolor);

  return base.initialize.call(this, el, width, height, padding);
};

prototype.background = function(bgcolor) {
  if (arguments.length && this._svg) {
    this._svg.style.setProperty('background-color', bgcolor);
  }
  return base.background.apply(this, arguments);
};

prototype.resize = function(width, height, padding) {
  base.resize.call(this, width, height, padding);
  
  if (this._svg) {
    var w = this._width,
        h = this._height,
        p = this._padding;
  
    this._svg.setAttribute('width', w + p.left + p.right);
    this._svg.setAttribute('height', h + p.top + p.bottom);
    
    this._root.setAttribute('transform', 'translate('+p.left+','+p.top+')');
  }

  return this;
};

prototype.svg = function() {
  if (!this._svg) return null;

  var attr = {
    'class':  'marks',
    'width':  this._width + this._padding.left + this._padding.right,
    'height': this._height + this._padding.top + this._padding.bottom,
  };
  for (var key in SVG.metadata) {
    attr[key] = SVG.metadata[key];
  }

  return DOM.openTag('svg', attr) + this._svg.innerHTML + DOM.closeTag('svg');
};

prototype.updateDefs = function() {
  var svg = this._svg,
      defs = this._defs,
      el = defs.el,
      index = 0, id;

  for (id in defs.gradient) {
    if (!el) el = (defs.el = DOM.child(svg, 0, 'defs', ns));
    updateGradient(el, defs.gradient[id], index++);
  }

  for (id in defs.clipping) {
    if (!el) el = (defs.el = DOM.child(svg, 0, 'defs', ns));
    updateClipping(el, defs.clipping[id], index++);
  }

  // clean-up
  if (el) {
    if (index === 0) {
      svg.removeChild(el);
      defs.el = null;
    } else {
      DOM.clear(el, index);      
    }
  }
};

function updateGradient(el, grad, index) {
  var i, n, stop;

  el = DOM.child(el, index, 'linearGradient', ns);
  el.setAttribute('id', grad.id);
  el.setAttribute('x1', grad.x1);
  el.setAttribute('x2', grad.x2);
  el.setAttribute('y1', grad.y1);
  el.setAttribute('y2', grad.y2);
  
  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = DOM.child(el, i, 'stop', ns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  DOM.clear(el, i);
}

function updateClipping(el, clip, index) {
  var rect;

  el = DOM.child(el, index, 'clipPath', ns);
  el.setAttribute('id', clip.id);
  rect = DOM.child(el, 0, 'rect', ns);
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', clip.width);
  rect.setAttribute('height', clip.height);
}

prototype._resetDefs = function() {
  var def = this._defs;
  def.clip_id = 1;
  def.gradient = {};
  def.clipping = {};
};

prototype.imageURL = function(url) {
  return this._loader.imageURL(url);
};

var element = null;

function emit(name, value, ns) {
  if (value != null) {
    if (ns) {
      element.setAttributeNS(ns, name, value);
    } else {
      element.setAttribute(name, value);
    }
  } else {
    if (ns) {
      element.removeAttributeNS(ns, name);
    } else {
      element.removeAttribute(name);
    }
  }
}

prototype._update = function(mdef, el, item) {
  element = el;
  mdef.attr(emit, item, this);
  if (mdef.type === 'group') {
    element = el.childNodes[0];
    mdef.background(emit, item, this);
  } else if (mdef.type === 'text') {
    el.textContent = item.text || '';
  }
  this.style(el, item);
};

prototype.render = function(scene, items) {
  if (this._dirtyCheck(items)) {
    if (this._dirtyAll) this._resetDefs();
    this.draw(this._root, scene, -1);
    DOM.clear(this._root, 1);
  }
  this.updateDefs();
  return this;
};

prototype._dirtyCheck = function(items) {
  this._dirtyAll = true;
  if (!items) return true;

  var id = ++this._dirtyID,
      el, item, mark, mdef, i, n;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;
    mdef = marks[mark.marktype];
    item = (mdef.nest ? mark.items[0] : item);
    el = item._svg;

    if (item._update === id) { // Already processed
      continue;
    } else if (item.status === 'exit') { // EXIT
      item._svg = null;
      if (el) DOM.remove(el);
    } else if (el) { // UPDATE
      this._update(mdef, el, item);
    } else { // ENTER
      this._dirtyAll = false;
      dirtyParents(item, id);
    }
    item._update = id;
  }
  return !this._dirtyAll;
};

function dirtyParents(item, id) {
  for (; item && item.dirty !== id; item=item.mark.group) {
    item.dirty = id;
    if (item.mark && item.mark.dirty !== id) {
      item.mark.dirty = id;
    } else return;
  }
}

prototype.isDirty = function(item) {
  return this._dirtyAll || item.dirty === this._dirtyID;
};

prototype.draw = function(el, scene, index) {
  this.drawMark(el, scene, index, marks[scene.marktype]);
};

prototype.drawMark = function(el, scene, index, mdef) {
  if (!this.isDirty(scene)) return;

  var items = mdef.nest
        ? (scene.items && scene.items.length ? [scene.items[0]] : [])
        : scene.items || [],
      events = scene.interactive === false ? 'none' : null,
      isGroup = (mdef.tag === 'g'),
      className = DOM.cssClass(scene),
      p, i, n, c, d, insert;

  p = DOM.child(el, index+1, 'g', ns, className);
  p.setAttribute('class', className);
  scene._svg = p;
  if (!isGroup && events) {
    p.style.setProperty('pointer-events', events);
  }

  for (i=0, n=items.length; i<n; ++i) {
    if (this.isDirty(d = items[i])) {
      insert = !(this._dirtyAll || d._svg);
      c = insert ? bind(p, mdef, d, i, true)
        : (p.childNodes[i] || bind(p, mdef, d, i));
      this._update(mdef, c, d);
      if (isGroup) {
        if (insert) this._dirtyAll = true;
        this._recurse(c, d);
        if (insert) this._dirtyAll = false;
      }
    }
  }
  DOM.clear(p, i);
  return p;
};

function bind(el, mdef, item, index, insert) {
  // create svg element, bind item data for D3 compatibility
  var node = DOM.child(el, index, mdef.tag, ns, null, insert);
  node.__data__ = item;
  // create background rect
  if (mdef.tag === 'g') {
    DOM.child(node, 0, 'rect', ns, 'background');
  }
  // add pointer from scenegraph item to svg element
  return (item._svg = node);
}

prototype._recurse = function(el, group) {
  var items = group.items || [],
      legends = group.legendItems || [],
      axes = group.axisItems || [],
      idx = 0, j, m;

  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer === 'back') {
      this.drawMark(el, axes[j], idx++, marks.group);
    }
  }
  for (j=0, m=items.length; j<m; ++j) {
    this.draw(el, items[j], idx++);
  }
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer !== 'back') {
      this.drawMark(el, axes[j], idx++, marks.group);
    }
  }
  for (j=0, m=legends.length; j<m; ++j) {
    this.drawMark(el, legends[j], idx++, marks.group);
  }

  // remove any extraneous DOM elements
  DOM.clear(el, 1 + idx);
};

prototype.style = function(el, o) {
  if (o == null) return;
  var i, n, prop, name, value;

  if (o.mark.marktype === 'group') {
    el = el.childNodes[0]; // set styles on background
    value = o.mark.interactive === false ? 'none' : null;
    el.style.setProperty('pointer-events', value);
  }
  
  if (o.mark.marktype === 'text') {
    el.style.setProperty('font', font.string(o));
  }

  for (i=0, n=SVG.styleProperties.length; i<n; ++i) {
    prop = SVG.styleProperties[i];
    name = SVG.styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === 'fill') {
        el.style.setProperty(name, 'none');
      } else {
        el.style.removeProperty(name);
      }
    } else {
      if (value.id) {
        // ensure definition is included
        this._defs.gradient[value.id] = value;
        value = 'url(' + href + '#' + value.id + ')';
      }
      el.style.setProperty(name, value+'');
    }
  }
};

module.exports = SVGRenderer;

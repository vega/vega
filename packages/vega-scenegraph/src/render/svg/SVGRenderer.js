var DOM = require('../../util/dom'),
    SVG = require('../../util/svg'),
    ImageLoader = require('../../util/ImageLoader'),
    ns = SVG.metadata.xmlns,
    marks = require('./marks'),
    Renderer = require('../Renderer');

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

  if (!grad.el) {
    grad.el = DOM.child(el, index, 'linearGradient', ns);
    grad.el.setAttribute('id', grad.id);
  }
  grad.el.setAttribute('x1', grad.x1);
  grad.el.setAttribute('x2', grad.x2);
  grad.el.setAttribute('y1', grad.y1);
  grad.el.setAttribute('y2', grad.y2);
  
  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = DOM.child(grad.el, i, 'stop', ns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  DOM.clear(grad.el, i);
}

function updateClipping(el, clip, index) {
  var rect;

  if (!clip.el) {
    clip.el = DOM.child(el, index, 'clipPath', ns);
    clip.el.setAttribute('id', clip.id);
    rect = DOM.child(clip.el, 0, 'rect', ns);
    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
  }
  rect = rect || clip.el.childNodes[0];
  rect.setAttribute('width', clip.width);
  rect.setAttribute('height', clip.height);
}

prototype.render = function(scene, items) {
  if (this._dirtyCheck(items)) {
    if (this._dirtyAll) {
      this._defs.gradient = {}; // clear gradient cache    
    }
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
      el, item, mark, i, n;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = marks[item.mark.marktype];
    item = (mark.nested ? item.mark.items : item);
    el = (mark.nested ? item[0] : item)._svg;

    if (item.status === 'exit') { // EXIT
      item._svg = null;
      DOM.remove(el);
    } else if (el) {              // UPDATE
      mark.update.call(this, el, item);
      this.style(el, item);
    } else {                      // ENTER
      this._dirtyAll = false;
      dirtyChildren(item, id);
      dirtyParents(item, id);
    }
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

function dirtyChildren(item, id) {
  if (item.items) dirtyItems(item.items, id);
  if (item.axisItems) dirtyItems(item.axisItems, id);
  if (item.legendItems) dirtyItems(item.legendItems, id);
}

function dirtyItems(items, id) {
  for (var i=0, n=items.length; i<n; ++i) {
    items[i].dirty = id;
    dirtyChildren(items[i], id);
  }
}

prototype.isDirty = function(item) {
  return this._dirtyAll || item.dirty === this._dirtyID;
};

prototype.draw = function(el, scene, index) {
  var mark = marks[scene.marktype];
  mark.draw.call(this, el, scene, index);
};

prototype.style = function(el, d) {
  var i, n, prop, name, value,
      o = Array.isArray(d) ? d[0] : d;
  if (o == null) return;

  if (o.mark.marktype === 'group') {
    el = el.childNodes[0]; // set styles on background
    value = o.mark.interactive === false ? 'none' : null;
    el.style.setProperty('pointer-events', value);
  }

  for (i=0, n=SVG.styleProperties.length; i<n; ++i) {
    prop = SVG.styleProperties[i];
    name = SVG.styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === 'fill') {
        el.style.setProperty(name, 'none', null);
      } else {
        el.style.removeProperty(name);
      }
    } else {
      if (value.id) {
        // ensure definition is included
        this._defs.gradient[value.id] = value;
        value = 'url(' + href + '#' + value.id + ')';
      }
      el.style.setProperty(name, value+'', null);
    }
  }
};

module.exports = SVGRenderer;

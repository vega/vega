import Renderer from './Renderer';
import marks from './marks/index';
import {domChild, domClear, domCreate, cssClass} from './util/dom';
import {openTag, closeTag} from './util/tags';
import {font, textValue} from './util/text';
import {visit} from './util/visit';
import clip from './util/svg/clip';
import metadata from './util/svg/metadata';
import {styles, styleProperties} from './util/svg/styles';
import {inherits} from 'vega-util';

var ns = metadata.xmlns;

export default function SVGRenderer(loader) {
  Renderer.call(this, loader);
  this._dirtyID = 0;
  this._svg = null;
  this._root = null;
  this._defs = null;
}

var prototype = inherits(SVGRenderer, Renderer);
var base = Renderer.prototype;

prototype.initialize = function(el, width, height, padding) {
  if (el) {
    this._svg = domChild(el, 0, 'svg', ns);
    this._svg.setAttribute('class', 'marks');
    domClear(el, 1);
    // set the svg root group
    this._root = domChild(this._svg, 0, 'g', ns);
    domClear(this._svg, 1);
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

prototype.resize = function(width, height, origin) {
  base.resize.call(this, width, height, origin);

  if (this._svg) {
    this._svg.setAttribute('width', this._width);
    this._svg.setAttribute('height', this._height);
    this._svg.setAttribute('viewBox', '0 0 ' + this._width + ' ' + this._height);
    this._root.setAttribute('transform', 'translate(' + this._origin + ')');
  }

  return this;
};

prototype.svg = function() {
  if (!this._svg) return null;

  var attr = {
    'class':  'marks',
    'width':  this._width,
    'height': this._height,
    'viewBox': '0 0 ' + this._width + ' ' + this._height
  };
  for (var key in metadata) {
    attr[key] = metadata[key];
  }

  return openTag('svg', attr) + this._svg.innerHTML + closeTag('svg');
};


// -- Render entry point --

prototype._render = function(scene, items) {
  // perform spot updates and re-render markup
  if (this._dirtyCheck(items)) {
    if (this._dirtyAll) this._resetDefs();
    this.draw(this._root, scene);
    domClear(this._root, 1);
  }

  this.updateDefs();
  return this;
};

// -- Manage SVG definitions ('defs') block --

prototype.updateDefs = function() {
  var svg = this._svg,
      defs = this._defs,
      el = defs.el,
      index = 0, id;

  for (id in defs.gradient) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateGradient(el, defs.gradient[id], index++);
  }

  for (id in defs.clipping) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateClipping(el, defs.clipping[id], index++);
  }

  // clean-up
  if (el) {
    if (index === 0) {
      svg.removeChild(el);
      defs.el = null;
    } else {
      domClear(el, index);
    }
  }
};

function updateGradient(el, grad, index) {
  var i, n, stop;

  el = domChild(el, index, 'linearGradient', ns);
  el.setAttribute('id', grad.id);
  el.setAttribute('x1', grad.x1);
  el.setAttribute('x2', grad.x2);
  el.setAttribute('y1', grad.y1);
  el.setAttribute('y2', grad.y2);

  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = domChild(el, i, 'stop', ns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  domClear(el, i);
}

function updateClipping(el, clip, index) {
  var rect;

  el = domChild(el, index, 'clipPath', ns);
  el.setAttribute('id', clip.id);
  rect = domChild(el, 0, 'rect', ns);
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


// -- Manage rendering of items marked as dirty --

prototype.isDirty = function(item) {
  return this._dirtyAll
    || !item._svg
    || item.dirty === this._dirtyID;
};

prototype._dirtyCheck = function(items) {
  this._dirtyAll = true;
  if (!items) return true;

  var id = ++this._dirtyID,
      item, mark, type, mdef, i, n, o;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;

    if (mark.marktype !== type) {
      // memoize mark instance lookup
      type = mark.marktype;
      mdef = marks[type];
    }

    if (mark.zdirty && mark.dirty !== id) {
      this._dirtyAll = false;
      mark.dirty = id;
      dirtyParents(mark.group, id);
    }

    if (item.exit) { // EXIT
      if (mdef.nested && mark.items.length) {
        // if nested mark with remaining points, update instead
        o = mark.items[0];
        if (o._svg) this._update(mdef, o._svg, o);
      } else if (item._svg) {
        // otherwise remove from DOM
        item._svg.parentNode.removeChild(item._svg);
      }
      item._svg = null;
      continue;
    }

    item = (mdef.nested ? mark.items[0] : item);
    if (item._update === id) continue; // already visited

    if (!item._svg || !item._svg.ownerSVGElement) {
      // ENTER
      this._dirtyAll = false;
      dirtyParents(item, id);
    } else {
      // IN-PLACE UPDATE
      this._update(mdef, item._svg, item);
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


// -- Construct & maintain scenegraph to SVG mapping ---

// Draw a mark container.
prototype.draw = function(el, scene, prev) {
  if (!this.isDirty(scene)) return scene._svg;

  var renderer = this,
      mdef = marks[scene.marktype],
      events = scene.interactive === false ? 'none' : null,
      isGroup = mdef.tag === 'g',
      sibling = null,
      i = 0,
      parent;

  parent = bind(scene, el, prev, 'g');
  parent.setAttribute('class', cssClass(scene));
  if (!isGroup && events) {
    parent.style.setProperty('pointer-events', events);
  }
  if (scene.clip) {
    parent.setAttribute('clip-path', clip(renderer, scene, scene.group));
  }

  function process(item) {
    var dirty = renderer.isDirty(item),
        node = bind(item, parent, sibling, mdef.tag);

    if (dirty) {
      renderer._update(mdef, node, item);
      if (isGroup) recurse(renderer, node, item);
    }

    sibling = node;
    ++i;
  }

  if (mdef.nested) {
    if (scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }

  domClear(parent, i);
  return parent;
};

// Recursively process group contents.
function recurse(renderer, el, group) {
  el = el.lastChild;
  var prev, idx = 0;

  visit(group, function(item) {
    prev = renderer.draw(el, item, prev);
    ++idx;
  });

  // remove any extraneous DOM elements
  domClear(el, 1 + idx);
}

// Bind a scenegraph item to an SVG DOM element.
// Create new SVG elements as needed.
function bind(item, el, sibling, tag) {
  var node = item._svg, doc;

  // create a new dom node if needed
  if (!node) {
    doc = el.ownerDocument;
    node = domCreate(doc, tag, ns);
    item._svg = node;

    if (item.mark) {
      node.__data__ = item;
      node.__values__ = {fill: 'default'};

      // if group, create background and foreground elements
      if (tag === 'g') {
        var bg = domCreate(doc, 'path', ns);
        bg.setAttribute('class', 'background');
        node.appendChild(bg);
        bg.__data__ = item;

        var fg = domCreate(doc, 'g', ns);
        node.appendChild(fg);
        fg.__data__ = item;
      }
    }
  }

  if (doc || node.previousSibling !== sibling) {
    el.insertBefore(node, sibling ? sibling.nextSibling : el.firstChild);
  }

  return node;
}


// -- Set attributes & styles on SVG elements ---

var element = null, // temp var for current SVG element
    values = null;  // temp var for current values hash

// Extra configuration for certain mark types
var mark_extras = {
  group: function(mdef, el, item) {
    values = el.__values__; // use parent's values hash

    element = el.childNodes[1];
    mdef.foreground(emit, item, this);

    element = el.childNodes[0];
    mdef.background(emit, item, this);

    var value = item.mark.interactive === false ? 'none' : null;
    if (value !== values.events) {
      element.style.setProperty('pointer-events', value);
      values.events = value;
    }
  },
  text: function(mdef, el, item) {
    var str = textValue(item);
    if (str !== values.text) {
      el.textContent = str;
      values.text = str;
    }
    str = font(item);
    if (str !== values.font) {
      el.style.setProperty('font', str);
      values.font = str;
    }
  }
};

prototype._update = function(mdef, el, item) {
  // set dom element and values cache
  // provides access to emit method
  element = el;
  values = el.__values__;

  // apply svg attributes
  mdef.attr(emit, item, this);

  // some marks need special treatment
  var extra = mark_extras[mdef.type];
  if (extra) extra.call(this, mdef, el, item);

  // apply svg css styles
  // note: element may be modified by 'extra' method
  this.style(element, item);
};

function emit(name, value, ns) {
  // early exit if value is unchanged
  if (value === values[name]) return;

  if (value != null) {
    // if value is provided, update DOM attribute
    if (ns) {
      element.setAttributeNS(ns, name, value);
    } else {
      element.setAttribute(name, value);
    }
  } else {
    // else remove DOM attribute
    if (ns) {
      element.removeAttributeNS(ns, name);
    } else {
      element.removeAttribute(name);
    }
  }

  // note current value for future comparison
  values[name] = value;
}

prototype.style = function(el, o) {
  if (o == null) return;
  var i, n, prop, name, value;

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    value = o[prop];
    if (value === values[prop]) continue;

    name = styles[prop];
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
        value = 'url(' + href() + '#' + value.id + ')';
      }
      el.style.setProperty(name, value+'');
    }

    values[prop] = value;
  }
};

function href() {
  return typeof window !== 'undefined' ? window.location.href : '';
}

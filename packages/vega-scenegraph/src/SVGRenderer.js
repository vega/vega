import Renderer from './Renderer.js';
import {gradientRef, isGradient, patternPrefix} from './Gradient.js';
import marks from './marks/index.js';
import {ariaItemAttributes, ariaMarkAttributes} from './util/aria.js';
import {cssClass, domChild, domClear, domCreate} from './util/dom.js';
import {serializeXML} from './util/markup.js';
import {fontFamily, fontSize, lineHeight, textLines, textValue} from './util/text.js';
import {visit} from './util/visit.js';
import clip from './util/svg/clip.js';
import metadata from './util/svg/metadata.js';
import {rootAttributes, stylesAttr, stylesCss} from './util/svg/styles.js';
import {isArray} from 'vega-util';

const RootIndex = 0,
      xmlns = 'http://www.w3.org/2000/xmlns/',
      svgns = metadata.xmlns;

export default class SVGRenderer extends Renderer {
  constructor(loader) {
    super(loader);
    this._dirtyID = 0;
    this._dirty = [];
    this._svg = null;
    this._root = null;
    this._defs = null;
  }

  /**
   * Initialize a new SVGRenderer instance.
   * @param {DOMElement} el - The containing DOM element for the display.
   * @param {number} width - The coordinate width of the display, in pixels.
   * @param {number} height - The coordinate height of the display, in pixels.
   * @param {Array<number>} origin - The origin of the display, in pixels.
   *   The coordinate system will be translated to this point.
   * @param {number} [scaleFactor=1] - Optional scaleFactor by which to multiply
   *   the width and height to determine the final pixel size.
   * @return {SVGRenderer} - This renderer instance.
   */
  initialize(el, width, height, origin, scaleFactor) {
    // create the svg definitions cache
    this._defs = {};
    this._clearDefs();

    if (el) {
      this._svg = domChild(el, 0, 'svg', svgns);
      this._svg.setAttributeNS(xmlns, 'xmlns', svgns);
      this._svg.setAttributeNS(xmlns, 'xmlns:xlink', metadata['xmlns:xlink']);
      this._svg.setAttribute('version', metadata['version']);
      this._svg.setAttribute('class', 'marks');
      domClear(el, 1);

      // set the svg root group
      this._root = domChild(this._svg, RootIndex, 'g', svgns);
      setAttributes(this._root, rootAttributes);

      // ensure no additional child elements
      domClear(this._svg, RootIndex + 1);
    }

    // set background color if defined
    this.background(this._bgcolor);

    return super.initialize(el, width, height, origin, scaleFactor);
  }

  /**
   * Get / set the background color.
   */
  background(bgcolor) {
    if (arguments.length && this._svg) {
      this._svg.style.setProperty('background-color', bgcolor);
    }
    return super.background(...arguments);
  }

  /**
   * Resize the display.
   * @param {number} width - The new coordinate width of the display, in pixels.
   * @param {number} height - The new coordinate height of the display, in pixels.
   * @param {Array<number>} origin - The new origin of the display, in pixels.
   *   The coordinate system will be translated to this point.
   * @param {number} [scaleFactor=1] - Optional scaleFactor by which to multiply
   *   the width and height to determine the final pixel size.
   * @return {SVGRenderer} - This renderer instance;
   */
  resize(width, height, origin, scaleFactor) {
    super.resize(width, height, origin, scaleFactor);

    if (this._svg) {
      setAttributes(this._svg, {
        width: this._width * this._scale,
        height: this._height * this._scale,
        viewBox: `0 0 ${this._width} ${this._height}`
      });
      this._root.setAttribute('transform', `translate(${this._origin})`);
    }

    this._dirty = [];

    return this;
  }

  /**
   * Returns the SVG element of the visualization.
   * @return {DOMElement} - The SVG element.
   */
  canvas() {
    return this._svg;
  }

  /**
   * Returns an SVG text string for the rendered content,
   * or null if this renderer is currently headless.
   */
  svg() {
    const svg = this._svg,
          bg = this._bgcolor;

    if (!svg) return null;

    let node;
    if (bg) {
      svg.removeAttribute('style');
      node = domChild(svg, RootIndex, 'rect', svgns);
      setAttributes(node, {width: this._width, height: this._height, fill: bg});
    }

    const text = serializeXML(svg);

    if (bg) {
      svg.removeChild(node);
      this._svg.style.setProperty('background-color', bg);
    }

    return text;
  }

  /**
   * Internal rendering method.
   * @param {object} scene - The root mark of a scenegraph to render.
   * @param {Array} markTypes - Array of the mark types to render.
   *                            If undefined, render all mark types
   */
  _render(scene, markTypes) {
    // perform spot updates and re-render markup
    if (this._dirtyCheck()) {
      if (this._dirtyAll) this._clearDefs();
      this.mark(this._root, scene, undefined, markTypes);
      domClear(this._root, 1);
    }

    this.defs();

    this._dirty = [];
    ++this._dirtyID;

    return this;
  }

  // -- Manage rendering of items marked as dirty --

  /**
   * Flag a mark item as dirty.
   * @param {Item} item - The mark item.
   */
  dirty(item) {
    if (item.dirty !== this._dirtyID) {
      item.dirty = this._dirtyID;
      this._dirty.push(item);
    }
  }

  /**
   * Check if a mark item is considered dirty.
   * @param {Item} item - The mark item.
   */
  isDirty(item) {
    return this._dirtyAll
      || !item._svg
      || !item._svg.ownerSVGElement
      || item.dirty === this._dirtyID;
  }

  /**
   * Internal method to check dirty status and, if possible,
   * make targetted updates without a full rendering pass.
   */
  _dirtyCheck() {
    this._dirtyAll = true;
    const items = this._dirty;
    if (!items.length || !this._dirtyID) return true;

    const id = ++this._dirtyID;
    let item, mark, type, mdef, i, n, o;

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
        dirtyParents(item, id);
        mark.items.forEach(i => { i.dirty = id; });
      }
      if (mark.zdirty) continue; // handle in standard drawing pass

      if (item.exit) { // EXIT
        if (mdef.nested && mark.items.length) {
          // if nested mark with remaining points, update instead
          o = mark.items[0];
          if (o._svg) this._update(mdef, o._svg, o);
        } else if (item._svg) {
          // otherwise remove from DOM
          o = item._svg.parentNode;
          if (o) o.removeChild(item._svg);
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
  }

  // -- Construct & maintain scenegraph to SVG mapping ---

  /**
   * Render a set of mark items.
   * @param {SVGElement} el - The parent element in the SVG tree.
   * @param {object} scene - The mark parent to render.
   * @param {SVGElement} prev - The previous sibling in the SVG tree.
   * @param {Array} markTypes - Array of the mark types to render.
   *                            If undefined, render all mark types
   */
  mark(el, scene, prev, markTypes) {
    if (!this.isDirty(scene)) {
      return scene._svg;
    }

    const svg = this._svg,
          markType = scene.marktype,
          mdef = marks[markType],
          events = scene.interactive === false ? 'none' : null,
          isGroup = mdef.tag === 'g';

    const parent = bind(scene, el, prev, 'g', svg);
    if (markType !== 'group' && markTypes != null && !markTypes.includes(markType)) {
      domClear(parent, 0);
      return scene._svg;
    }

    parent.setAttribute('class', cssClass(scene));

    // apply aria attributes to parent container element
    const aria = ariaMarkAttributes(scene);
    for (const key in aria) setAttribute(parent, key, aria[key]);

    if (!isGroup) {
      setAttribute(parent, 'pointer-events', events);
    }
    setAttribute(parent, 'clip-path',
      scene.clip ? clip(this, scene, scene.group) : null);

    let sibling = null,
        i = 0;

    const process = item => {
      const dirty = this.isDirty(item),
            node = bind(item, parent, sibling, mdef.tag, svg);

      if (dirty) {
        this._update(mdef, node, item);
        if (isGroup) recurse(this, node, item, markTypes);
      }

      sibling = node;
      ++i;
    };

    if (mdef.nested) {
      if (scene.items.length) process(scene.items[0]);
    } else {
      visit(scene, process);
    }

    domClear(parent, i);
    return parent;
  }

  /**
   * Update the attributes of an SVG element for a mark item.
   * @param {object} mdef - The mark definition object
   * @param {SVGElement} el - The SVG element.
   * @param {Item} item - The mark item.
   */
  _update(mdef, el, item) {
    // set dom element and values cache
    // provides access to emit method
    element = el;
    values = el.__values__;

    // apply aria-specific properties
    ariaItemAttributes(emit, item);

    // apply svg attributes
    mdef.attr(emit, item, this);

    // some marks need special treatment
    const extra = mark_extras[mdef.type];
    if (extra) extra.call(this, mdef, el, item);

    // apply svg style attributes
    // note: element state may have been modified by 'extra' method
    if (element) this.style(element, item);
  }

  /**
   * Update the presentation attributes of an SVG element for a mark item.
   * @param {SVGElement} el - The SVG element.
   * @param {Item} item - The mark item.
   */
  style(el, item) {
    if (item == null) return;

    for (const prop in stylesAttr) {
      let value = prop === 'font' ? fontFamily(item) : item[prop];
      if (value === values[prop]) continue;

      const name = stylesAttr[prop];
      if (value == null) {
        el.removeAttribute(name);
      } else {
        if (isGradient(value)) {
          value = gradientRef(value, this._defs.gradient, href());
        }
        el.setAttribute(name, value + '');
      }

      values[prop] = value;
    }

    for (const prop in stylesCss) {
      setStyle(el, stylesCss[prop], item[prop]);
    }
  }

  /**
   * Render SVG defs, as needed.
   * Must be called *after* marks have been processed to ensure the
   * collected state is current and accurate.
   */
  defs() {
    const svg = this._svg,
          defs = this._defs;

    let el = defs.el,
        index = 0;

    for (const id in defs.gradient) {
      if (!el) defs.el = (el = domChild(svg, RootIndex + 1, 'defs', svgns));
      index = updateGradient(el, defs.gradient[id], index);
    }

    for (const id in defs.clipping) {
      if (!el) defs.el = (el = domChild(svg, RootIndex + 1, 'defs', svgns));
      index = updateClipping(el, defs.clipping[id], index);
    }

    // clean-up
    if (el) {
      index === 0
        ? (svg.removeChild(el), defs.el = null)
        : domClear(el, index);
    }
  }

  /**
   * Clear defs caches.
   */
  _clearDefs() {
    const def = this._defs;
    def.gradient = {};
    def.clipping = {};
  }
}

// mark ancestor chain with a dirty id
function dirtyParents(item, id) {
  for (; item && item.dirty !== id; item=item.mark.group) {
    item.dirty = id;
    if (item.mark && item.mark.dirty !== id) {
      item.mark.dirty = id;
    } else return;
  }
}

// update gradient definitions
function updateGradient(el, grad, index) {
  let i, n, stop;

  if (grad.gradient === 'radial') {
    // SVG radial gradients automatically transform to normalized bbox
    // coordinates, in a way that is cumbersome to replicate in canvas.
    // We wrap the radial gradient in a pattern element, allowing us to
    // maintain a circular gradient that matches what canvas provides.
    let pt = domChild(el, index++, 'pattern', svgns);
    setAttributes(pt, {
      id: patternPrefix + grad.id,
      viewBox: '0,0,1,1',
      width: '100%',
      height: '100%',
      preserveAspectRatio: 'xMidYMid slice'
    });

    pt = domChild(pt, 0, 'rect', svgns);
    setAttributes(pt, {
      width: 1,
      height: 1,
      fill: `url(${href()}#${grad.id})`
    });

    el = domChild(el, index++, 'radialGradient', svgns);
    setAttributes(el, {
      id: grad.id,
      fx: grad.x1,
      fy: grad.y1,
      fr: grad.r1,
      cx: grad.x2,
      cy: grad.y2,
      r: grad.r2
    });
  } else {
    el = domChild(el, index++, 'linearGradient', svgns);
    setAttributes(el, {
      id: grad.id,
      x1: grad.x1,
      x2: grad.x2,
      y1: grad.y1,
      y2: grad.y2
    });
  }

  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = domChild(el, i, 'stop', svgns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  domClear(el, i);

  return index;
}

// update clipping path definitions
function updateClipping(el, clip, index) {
  let mask;

  el = domChild(el, index, 'clipPath', svgns);
  el.setAttribute('id', clip.id);

  if (clip.path) {
    mask = domChild(el, 0, 'path', svgns);
    mask.setAttribute('d', clip.path);
  } else {
    mask = domChild(el, 0, 'rect', svgns);
    setAttributes(mask, {x: 0, y: 0, width: clip.width, height: clip.height});
  }
  domClear(el, 1);

  return index + 1;
}

// Recursively process group contents.
function recurse(renderer, el, group, markTypes) {
  // child 'g' element is second to last among children (path, g, path)
  // other children here are foreground and background path elements
  el = el.lastChild.previousSibling;
  let prev, idx = 0;

  visit(group, item => {
    prev = renderer.mark(el, item, prev, markTypes);
    ++idx;
  });

  // remove any extraneous DOM elements
  domClear(el, 1 + idx);
}

// Bind a scenegraph item to an SVG DOM element.
// Create new SVG elements as needed.
function bind(item, el, sibling, tag, svg) {
  let node = item._svg, doc;

  // create a new dom node if needed
  if (!node) {
    doc = el.ownerDocument;
    node = domCreate(doc, tag, svgns);
    item._svg = node;

    if (item.mark) {
      node.__data__ = item;
      node.__values__ = {fill: 'default'};

      // if group, create background, content, and foreground elements
      if (tag === 'g') {
        const bg = domCreate(doc, 'path', svgns);
        node.appendChild(bg);
        bg.__data__ = item;

        const cg = domCreate(doc, 'g', svgns);
        node.appendChild(cg);
        cg.__data__ = item;

        const fg = domCreate(doc, 'path', svgns);
        node.appendChild(fg);
        fg.__data__ = item;
        fg.__values__ = {fill: 'default'};
      }
    }
  }

  // (re-)insert if (a) not contained in SVG or (b) sibling order has changed
  if (node.ownerSVGElement !== svg || siblingCheck(node, sibling)) {
    el.insertBefore(node, sibling ? sibling.nextSibling : el.firstChild);
  }

  return node;
}

// check if two nodes are ordered siblings
function siblingCheck(node, sibling) {
  return node.parentNode
    && node.parentNode.childNodes.length > 1
    && node.previousSibling != sibling; // treat null/undefined the same
}

// -- Set attributes & styles on SVG elements ---

let element = null, // temp var for current SVG element
    values = null;  // temp var for current values hash

// Extra configuration for certain mark types
const mark_extras = {
  group(mdef, el, item) {
    const fg = element = el.childNodes[2];
    values = fg.__values__;
    mdef.foreground(emit, item, this);

    values = el.__values__; // use parent's values hash
    element = el.childNodes[1];
    mdef.content(emit, item, this);

    const bg = element = el.childNodes[0];
    mdef.background(emit, item, this);

    const value = item.mark.interactive === false ? 'none' : null;
    if (value !== values.events) {
      setAttribute(fg, 'pointer-events', value);
      setAttribute(bg, 'pointer-events', value);
      values.events = value;
    }

    if (item.strokeForeground && item.stroke) {
      const fill = item.fill;
      setAttribute(fg, 'display', null);

      // set style of background
      this.style(bg, item);
      setAttribute(bg, 'stroke', null);

      // set style of foreground
      if (fill) item.fill = null;
      values = fg.__values__;
      this.style(fg, item);
      if (fill) item.fill = fill;

      // leave element null to prevent downstream styling
      element = null;
    } else {
      // ensure foreground is ignored
      setAttribute(fg, 'display', 'none');
    }
  },
  image(mdef, el, item) {
    if (item.smooth === false) {
      setStyle(el, 'image-rendering', 'optimizeSpeed');
      setStyle(el, 'image-rendering', 'pixelated');
    } else {
      setStyle(el, 'image-rendering', null);
    }
  },
  text(mdef, el, item) {
    const tl = textLines(item);
    let key, value, doc, lh;

    if (isArray(tl)) {
      // multi-line text
      value = tl.map(_ => textValue(item, _));
      key = value.join('\n'); // content cache key

      if (key !== values.text) {
        domClear(el, 0);
        doc = el.ownerDocument;
        lh = lineHeight(item);
        value.forEach((t, i) => {
          const ts = domCreate(doc, 'tspan', svgns);
          ts.__data__ = item; // data binding
          ts.textContent = t;
          if (i) {
            ts.setAttribute('x', 0);
            ts.setAttribute('dy', lh);
          }
          el.appendChild(ts);
        });
        values.text = key;
      }
    } else {
      // single-line text
      value = textValue(item, tl);
      if (value !== values.text) {
        el.textContent = value;
        values.text = value;
      }
    }

    setAttribute(el, 'font-family', fontFamily(item));
    setAttribute(el, 'font-size', fontSize(item) + 'px');
    setAttribute(el, 'font-style', item.fontStyle);
    setAttribute(el, 'font-variant', item.fontVariant);
    setAttribute(el, 'font-weight', item.fontWeight);
  }
};

function emit(name, value, ns) {
  // early exit if value is unchanged
  if (value === values[name]) return;

  // use appropriate method given namespace (ns)
  if (ns) {
    setAttributeNS(element, name, value, ns);
  } else {
    setAttribute(element, name, value);
  }

  // note current value for future comparison
  values[name] = value;
}

function setStyle(el, name, value) {
  if (value !== values[name]) {
    if (value == null) {
      el.style.removeProperty(name);
    } else {
      el.style.setProperty(name, value + '');
    }
    values[name] = value;
  }
}

function setAttributes(el, attrs) {
  for (const key in attrs) {
    setAttribute(el, key, attrs[key]);
  }
}

function setAttribute(el, name, value) {
  if (value != null) {
    // if value is provided, update DOM attribute
    el.setAttribute(name, value);
  } else {
    // else remove DOM attribute
    el.removeAttribute(name);
  }
}

function setAttributeNS(el, name, value, ns) {
  if (value != null) {
    // if value is provided, update DOM attribute
    el.setAttributeNS(ns, name, value);
  } else {
    // else remove DOM attribute
    el.removeAttributeNS(ns, name);
  }
}

function href() {
  let loc;
  return typeof window === 'undefined' ? ''
    : (loc = window.location).hash ? loc.href.slice(0, -loc.hash.length)
    : loc.href;
}

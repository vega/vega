import Renderer from './Renderer.js';
import {gradientRef, isGradient, patternPrefix} from './Gradient.js';
import Marks from './marks/index.js';
import {ariaItemAttributes, ariaMarkAttributes} from './util/aria.js';
import {cssClass} from './util/dom.js';
import {markup} from './util/markup.js';
import {fontFamily, fontSize, lineHeight, textLines, textValue} from './util/text.js';
import {visit} from './util/visit.js';
import clip from './util/svg/clip.js';
import metadata from './util/svg/metadata.js';
import {rootAttributes, stylesAttr, stylesCss} from './util/svg/styles.js';
import {extend, isArray} from 'vega-util';

export default class SVGStringRenderer extends Renderer {
  constructor(loader) {
    super(loader);
    this._text = null;
    this._defs = {
      gradient: {},
      clipping: {}
    };
  }

  /**
   * Returns the rendered SVG text string,
   * or null if rendering has not yet occurred.
   */
  svg() {
    return this._text;
  }

  /**
   * Internal rendering method.
   * @param {object} scene - The root mark of a scenegraph to render.
   */
  _render(scene) {
    const m = markup();

    // svg tag
    m.open('svg', extend({}, metadata, {
      class:   'marks',
      width:   this._width * this._scale,
      height:  this._height * this._scale,
      viewBox: `0 0 ${this._width} ${this._height}`
    }));

    // background, if defined
    const bg = this._bgcolor;
    if (bg && bg !== 'transparent' && bg !== 'none') {
      m.open('rect', {
        width:  this._width,
        height: this._height,
        fill:   bg
      }).close();
    }

    // root content group
    m.open('g', rootAttributes, {
      transform: 'translate(' + this._origin + ')'
    });
    this.mark(m, scene);
    m.close(); // </g>

    // defs
    this.defs(m);

    // get SVG text string
    this._text = m.close() + '';

    return this;
  }

  /**
   * Render a set of mark items.
   * @param {object} m - The markup context.
   * @param {object} scene - The mark parent to render.
   */
  mark(m, scene) {
    const mdef = Marks[scene.marktype],
          tag  = mdef.tag,
          attrList = [ariaItemAttributes, mdef.attr];

    // render opening group tag
    m.open('g',
      {
        'class': cssClass(scene),
        'clip-path': scene.clip ? clip(this, scene, scene.group) : null
      },
      ariaMarkAttributes(scene),
      {
        'pointer-events': tag !== 'g' && scene.interactive === false ? 'none' : null
      }
    );

    // render contained elements
    const process = item => {
      const href = this.href(item);
      if (href) m.open('a', href);

      m.open(
        tag,
        this.attr(scene, item, attrList, tag !== 'g' ? tag : null)
      );

      if (tag === 'text') {
        const tl = textLines(item);
        if (isArray(tl)) {
          // multi-line text
          const attrs = {x: 0, dy: lineHeight(item)};
          for (let i=0; i<tl.length; ++i) {
            m.open('tspan', i ? attrs: null)
              .text(textValue(item, tl[i]))
              .close();
          }
        } else {
          // single-line text
          m.text(textValue(item, tl));
        }
      } else if (tag === 'g') {
        const fore = item.strokeForeground,
              fill = item.fill,
              stroke = item.stroke;

        if (fore && stroke) {
          item.stroke = null;
        }

        m.open(
          'path',
          this.attr(scene, item, mdef.background, 'bgrect')
        ).close();

        // recurse for group content
        m.open('g', this.attr(scene, item, mdef.content));
        visit(item, scene => this.mark(m, scene));
        m.close();

        if (fore && stroke) {
          if (fill) item.fill = null;
          item.stroke = stroke;

          m.open(
            'path',
            this.attr(scene, item, mdef.foreground, 'bgrect')
          ).close();

          if (fill) item.fill = fill;
        } else {
          m.open(
            'path',
            this.attr(scene, item, mdef.foreground, 'bgfore')
          ).close();
        }
      }

      m.close(); // </tag>
      if (href) m.close(); // </a>
    };

    if (mdef.nested) {
      if (scene.items && scene.items.length) process(scene.items[0]);
    } else {
      visit(scene, process);
    }

    // render closing group tag
    return m.close(); // </g>
  }

  /**
   * Get href attributes for a hyperlinked mark item.
   * @param {Item} item - The mark item.
   */
  href(item) {
    const href = item.href;
    let attr;

    if (href) {
      if (attr = this._hrefs && this._hrefs[href]) {
        return attr;
      } else {
        this.sanitizeURL(href).then(attr => {
          // rewrite to use xlink namespace
          attr['xlink:href'] = attr.href;
          attr.href = null;
          (this._hrefs || (this._hrefs = {}))[href] = attr;
        });
      }
    }
    return null;
  }

  /**
   * Get an object of SVG attributes for a mark item.
   * @param {object} scene - The mark parent.
   * @param {Item} item - The mark item.
   * @param {array|function} attrs - One or more attribute emitters.
   * @param {string} tag - The tag being rendered.
   */
  attr(scene, item, attrs, tag) {
    const object = {},
          emit = (name, value, ns, prefixed) => {
            object[prefixed || name] = value;
          };

    // apply mark specific attributes
    if (Array.isArray(attrs)) {
      attrs.forEach(fn => fn(emit, item, this));
    } else {
      attrs(emit, item, this);
    }

    // apply style attributes
    if (tag) {
      style(object, item, scene, tag, this._defs);
    }

    return object;
  }

  /**
   * Render SVG defs, as needed.
   * Must be called *after* marks have been processed to ensure the
   * collected state is current and accurate.
   * @param {object} m - The markup context.
   */
  defs(m) {
    const gradient = this._defs.gradient,
          clipping = this._defs.clipping,
          count = Object.keys(gradient).length + Object.keys(clipping).length;

    if (count === 0) return; // nothing to do

    m.open('defs');

    for (const id in gradient) {
      const def = gradient[id],
            stops = def.stops;

      if (def.gradient === 'radial') {
        // SVG radial gradients automatically transform to normalized bbox
        // coordinates, in a way that is cumbersome to replicate in canvas.
        // We wrap the radial gradient in a pattern element, allowing us to
        // maintain a circular gradient that matches what canvas provides.

        m.open('pattern', {
          id: patternPrefix + id,
          viewBox: '0,0,1,1',
          width: '100%',
          height: '100%',
          preserveAspectRatio: 'xMidYMid slice'
        });

        m.open('rect', {
          width:  '1',
          height: '1',
          fill:   'url(#' + id + ')'
        }).close();

        m.close(); // </pattern>

        m.open('radialGradient', {
          id: id,
          fx: def.x1,
          fy: def.y1,
          fr: def.r1,
          cx: def.x2,
          cy: def.y2,
          r: def.r2
        });
      } else {
        m.open('linearGradient', {
          id: id,
          x1: def.x1,
          x2: def.x2,
          y1: def.y1,
          y2: def.y2
        });
      }

      for (let i = 0; i < stops.length; ++i) {
        m.open('stop', {
          offset: stops[i].offset,
          'stop-color': stops[i].color
        }).close();
      }

      m.close();
    }

    for (const id in clipping) {
      const def = clipping[id];

      m.open('clipPath', {id: id});
      if (def.path) {
        m.open('path', {
          d: def.path
        }).close();
      } else {
        m.open('rect', {
          x: 0,
          y: 0,
          width: def.width,
          height: def.height
        }).close();
      }
      m.close();
    }

    m.close();
  }
}

// Helper function for attr for style presentation attributes
function style(s, item, scene, tag, defs) {
  let styleList;
  if (item == null) return s;

  if (tag === 'bgrect' && scene.interactive === false) {
    s['pointer-events'] = 'none';
  }

  if (tag === 'bgfore') {
    if (scene.interactive === false) {
      s['pointer-events'] = 'none';
    }
    s.display = 'none';
    if (item.fill !== null) return s;
  }

  if (tag === 'image' && item.smooth === false) {
    styleList = [
      'image-rendering: optimizeSpeed;',
      'image-rendering: pixelated;'
    ];
  }

  if (tag === 'text') {
    s['font-family'] = fontFamily(item);
    s['font-size'] = fontSize(item) + 'px';
    s['font-style'] = item.fontStyle;
    s['font-variant'] = item.fontVariant;
    s['font-weight'] = item.fontWeight;
  }

  for (const prop in stylesAttr) {
    let value = item[prop];
    const name = stylesAttr[prop];

    if (value === 'transparent' && (name === 'fill' || name === 'stroke')) {
      // transparent is not a legal SVG value
      // we can skip it to rely on default 'none' instead
    } else if (value != null) {
      if (isGradient(value)) {
        value = gradientRef(value, defs.gradient, '');
      }
      s[name] = value;
    }
  }

  for (const prop in stylesCss) {
    const value = item[prop];
    if (value != null) {
      styleList = styleList || [];
      styleList.push(`${stylesCss[prop]}: ${value};`);
    }
  }
  if (styleList) {
    s.style = styleList.join(' ');
  }

  return s;
}

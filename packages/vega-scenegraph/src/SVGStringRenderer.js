import Renderer from './Renderer';
import {gradientRef, isGradient, patternPrefix} from './Gradient';
import marks from './marks/index';
import {cssClass} from './util/dom';
import {openTag, closeTag} from './util/tags';
import {fontFamily, fontSize, lineHeight, textLines, textValue} from './util/text';
import {visit} from './util/visit';
import clip from './util/svg/clip';
import metadata from './util/svg/metadata';
import {styles, styleProperties} from './util/svg/styles';
import {inherits, isArray} from 'vega-util';

export default function SVGStringRenderer(loader) {
  Renderer.call(this, loader);

  this._text = {
    head: '',
    bg: '',
    root: '',
    foot: '',
    defs: '',
    body: ''
  };

  this._defs = {
    gradient: {},
    clipping: {}
  };
}

const prototype = inherits(SVGStringRenderer, Renderer);
const base = Renderer.prototype;

prototype.resize = function (width, height, origin, scaleFactor) {
  base.resize.call(this, width, height, origin, scaleFactor);
  const o = this._origin;
  const t = this._text;

  const attr = {
    class: 'marks',
    width: this._width * this._scale,
    height: this._height * this._scale,
    viewBox: '0 0 ' + this._width + ' ' + this._height
  };
  for (const key in metadata) {
    attr[key] = metadata[key];
  }

  t.head = openTag('svg', attr);

  let bg = this._bgcolor;
  if (bg === 'transparent' || bg === 'none') bg = null;

  if (bg) {
    t.bg =
      openTag('rect', {
        width: this._width,
        height: this._height,
        style: 'fill: ' + bg + ';'
      }) + closeTag('rect');
  } else {
    t.bg = '';
  }

  t.root = openTag('g', {
    transform: 'translate(' + o + ')'
  });

  t.foot = closeTag('g') + closeTag('svg');

  return this;
};

prototype.background = function (...args) {
  const rv = base.background.apply(this, args);
  if (arguments.length && this._text.head) {
    this.resize(this._width, this._height, this._origin, this._scale);
  }
  return rv;
};

prototype.svg = function () {
  const t = this._text;
  return t.head + t.bg + t.defs + t.root + t.body + t.foot;
};

prototype._render = function (scene) {
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
  return this;
};

prototype.buildDefs = function () {
  const all = this._defs;
  let defs = '';
  let i;
  let id;
  let def;
  let tag;
  let stops;

  for (id in all.gradient) {
    def = all.gradient[id];
    stops = def.stops;

    if (def.gradient === 'radial') {
      // SVG radial gradients automatically transform to normalized bbox
      // coordinates, in a way that is cumbersome to replicate in canvas.
      // We wrap the radial gradient in a pattern element, allowing us to
      // maintain a circular gradient that matches what canvas provides.

      defs += openTag((tag = 'pattern'), {
        id: patternPrefix + id,
        viewBox: '0,0,1,1',
        width: '100%',
        height: '100%',
        preserveAspectRatio: 'xMidYMid slice'
      });

      defs +=
        openTag('rect', {
          width: '1',
          height: '1',
          fill: 'url(#' + id + ')'
        }) + closeTag('rect');

      defs += closeTag(tag);

      defs += openTag((tag = 'radialGradient'), {
        id: id,
        fx: def.x1,
        fy: def.y1,
        fr: def.r1,
        cx: def.x2,
        cy: def.y2,
        r: def.r2
      });
    } else {
      defs += openTag((tag = 'linearGradient'), {
        id: id,
        x1: def.x1,
        x2: def.x2,
        y1: def.y1,
        y2: def.y2
      });
    }

    for (i = 0; i < stops.length; ++i) {
      defs +=
        openTag('stop', {
          offset: stops[i].offset,
          'stop-color': stops[i].color
        }) + closeTag('stop');
    }

    defs += closeTag(tag);
  }

  for (id in all.clipping) {
    def = all.clipping[id];

    defs += openTag('clipPath', {id: id});

    if (def.path) {
      defs +=
        openTag('path', {
          d: def.path
        }) + closeTag('path');
    } else {
      defs +=
        openTag('rect', {
          x: 0,
          y: 0,
          width: def.width,
          height: def.height
        }) + closeTag('rect');
    }

    defs += closeTag('clipPath');
  }

  return defs.length > 0 ? openTag('defs') + defs + closeTag('defs') : '';
};

let object;

function emit(name, value, ns, prefixed) {
  object[prefixed || name] = value;
}

prototype.attributes = function (attr, item) {
  object = {};
  attr(emit, item, this);
  return object;
};

prototype.href = function (item) {
  const that = this;
  const href = item.href;
  let attr;

  if (href) {
    if ((attr = that._hrefs && that._hrefs[href])) {
      return attr;
    } else {
      that.sanitizeURL(href).then(function (attr) {
        // rewrite to use xlink namespace
        // note that this will be deprecated in SVG 2.0
        attr['xlink:href'] = attr.href;
        attr.href = null;
        (that._hrefs || (that._hrefs = {}))[href] = attr;
      });
    }
  }
  return null;
};

prototype.mark = function (scene) {
  const renderer = this;
  const mdef = marks[scene.marktype];
  const tag = mdef.tag;
  const defs = this._defs;
  let str = '';
  let style;

  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }

  // render opening group tag
  str += openTag(
    'g',
    {
      class: cssClass(scene),
      'clip-path': scene.clip ? clip(renderer, scene, scene.group) : null
    },
    style
  );

  // render contained elements
  function process(item) {
    const href = renderer.href(item);
    if (href) str += openTag('a', href);

    style = tag !== 'g' ? applyStyles(item, scene, tag, defs) : null;
    str += openTag(tag, renderer.attributes(mdef.attr, item), style);

    if (tag === 'text') {
      const tl = textLines(item);
      if (isArray(tl)) {
        // multi-line text
        const attrs = {x: 0, dy: lineHeight(item)};
        for (let i = 0; i < tl.length; ++i) {
          str += openTag('tspan', i ? attrs : null) + escape_text(textValue(item, tl[i])) + closeTag('tspan');
        }
      } else {
        // single-line text
        str += escape_text(textValue(item, tl));
      }
    } else if (tag === 'g') {
      const fore = item.strokeForeground;
      const fill = item.fill;
      const stroke = item.stroke;

      if (fore && stroke) {
        item.stroke = null;
      }

      str +=
        openTag('path', renderer.attributes(mdef.background, item), applyStyles(item, scene, 'bgrect', defs)) +
        closeTag('path');

      str += openTag('g', renderer.attributes(mdef.content, item)) + renderer.markGroup(item) + closeTag('g');

      if (fore && stroke) {
        if (fill) item.fill = null;
        item.stroke = stroke;

        str +=
          openTag('path', renderer.attributes(mdef.foreground, item), applyStyles(item, scene, 'bgrect', defs)) +
          closeTag('path');

        if (fill) item.fill = fill;
      } else {
        str +=
          openTag('path', renderer.attributes(mdef.foreground, item), applyStyles({}, scene, 'bgfore', defs)) +
          closeTag('path');
      }
    }

    str += closeTag(tag);
    if (href) str += closeTag('a');
  }

  if (mdef.nested) {
    if (scene.items && scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }

  // render closing group tag
  return str + closeTag('g');
};

prototype.markGroup = function (scene) {
  const renderer = this;
  let str = '';

  visit(scene, function (item) {
    str += renderer.mark(item);
  });

  return str;
};

function applyStyles(o, mark, tag, defs) {
  if (o == null) return '';
  let i;
  let n;
  let prop;
  let name;
  let value;
  let s = '';

  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none; ';
  }

  if (tag === 'bgfore') {
    if (mark.interactive === false) {
      s += 'pointer-events: none; ';
    }
    s += 'display: none; ';
  }

  if (tag === 'image') {
    if (o.smooth === false) {
      s += 'image-rendering: optimizeSpeed; image-rendering: pixelated; ';
    }
  }

  if (tag === 'text') {
    s += 'font-family: ' + fontFamily(o) + '; ';
    s += 'font-size: ' + fontSize(o) + 'px; ';
    if (o.fontStyle) s += 'font-style: ' + o.fontStyle + '; ';
    if (o.fontVariant) s += 'font-variant: ' + o.fontVariant + '; ';
    if (o.fontWeight) s += 'font-weight: ' + o.fontWeight + '; ';
  }

  for (i = 0, n = styleProperties.length; i < n; ++i) {
    prop = styleProperties[i];
    name = styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === 'fill') {
        s += 'fill: none; ';
      }
    } else if (value === 'transparent' && (name === 'fill' || name === 'stroke')) {
      // transparent is not a legal SVG value, so map to none instead
      s += name + ': none; ';
    } else {
      if (isGradient(value)) {
        value = gradientRef(value, defs.gradient, '');
      }
      s += name + ': ' + value + '; ';
    }
  }

  return s ? 'style="' + s.trim() + '"' : null;
}

function escape_text(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

import Renderer from './Renderer';
import marks from './marks/index';
import {cssClass} from './util/dom';
import {openTag, closeTag} from './util/tags';
import {fontFamily, fontSize, textValue} from './util/text';
import {visit} from './util/visit';
import clip from './util/svg/clip';
import metadata from './util/svg/metadata';
import {styles, styleProperties} from './util/svg/styles';
import {inherits} from 'vega-util';

export default function SVGStringRenderer(loader) {
  Renderer.call(this, loader);

  this._text = {
    head: '',
    bg:   '',
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

var prototype = inherits(SVGStringRenderer, Renderer);
var base = Renderer.prototype;

prototype.resize = function(width, height, origin, scaleFactor) {
  base.resize.call(this, width, height, origin, scaleFactor);
  var o = this._origin,
      t = this._text;

  var attr = {
    class:   'marks',
    width:   this._width * this._scale,
    height:  this._height * this._scale,
    viewBox: '0 0 ' + this._width + ' ' + this._height
  };
  for (var key in metadata) {
    attr[key] = metadata[key];
  }

  t.head = openTag('svg', attr);

  var bg = this._bgcolor;
  if (bg === 'transparent' || bg === 'none') bg = null;

  if (bg) {
    t.bg = openTag('rect', {
      width:  this._width,
      height: this._height,
      style:  'fill: ' + bg + ';'
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

prototype.background = function() {
  var rv = base.background.apply(this, arguments);
  if (arguments.length && this._text.head) {
    this.resize(this._width, this._height, this._origin, this._scale);
  }
  return rv;
};

prototype.svg = function() {
  var t = this._text;
  return t.head + t.bg + t.defs + t.root + t.body + t.foot;
};

prototype._render = function(scene) {
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
  return this;
};

prototype.buildDefs = function() {
  var all = this._defs,
      defs = '',
      i, id, def, stops;

  for (id in all.gradient) {
    def = all.gradient[id];
    stops = def.stops;

    defs += openTag('linearGradient', {
      id: id,
      x1: def.x1,
      x2: def.x2,
      y1: def.y1,
      y2: def.y2
    });

    for (i=0; i<stops.length; ++i) {
      defs += openTag('stop', {
        offset: stops[i].offset,
        'stop-color': stops[i].color
      }) + closeTag('stop');
    }

    defs += closeTag('linearGradient');
  }

  for (id in all.clipping) {
    def = all.clipping[id];

    defs += openTag('clipPath', {id: id});

    if (def.path) {
      defs += openTag('path', {
        d: def.path
      }) + closeTag('path');
    } else {
      defs += openTag('rect', {
        x: 0,
        y: 0,
        width: def.width,
        height: def.height
      }) + closeTag('rect');
    }

    defs += closeTag('clipPath');
  }

  return (defs.length > 0) ? openTag('defs') + defs + closeTag('defs') : '';
};

var object;

function emit(name, value, ns, prefixed) {
  object[prefixed || name] = value;
}

prototype.attributes = function(attr, item) {
  object = {};
  attr(emit, item, this);
  return object;
};

prototype.href = function(item) {
  var that = this,
      href = item.href,
      attr;

  if (href) {
    if (attr = that._hrefs && that._hrefs[href]) {
      return attr;
    } else {
      that.sanitizeURL(href).then(function(attr) {
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

prototype.mark = function(scene) {
  var renderer = this,
      mdef = marks[scene.marktype],
      tag  = mdef.tag,
      defs = this._defs,
      str = '',
      style;

  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }

  // render opening group tag
  str += openTag('g', {
    'class': cssClass(scene),
    'clip-path': scene.clip ? clip(renderer, scene, scene.group) : null
  }, style);

  // render contained elements
  function process(item) {
    var href = renderer.href(item);
    if (href) str += openTag('a', href);

    style = (tag !== 'g') ? applyStyles(item, scene, tag, defs) : null;
    str += openTag(tag, renderer.attributes(mdef.attr, item), style);

    if (tag === 'text') {
      str += escape_text(textValue(item));
    } else if (tag === 'g') {
      str += openTag('path', renderer.attributes(mdef.background, item),
        applyStyles(item, scene, 'bgrect', defs)) + closeTag('path');

      str += openTag('g', renderer.attributes(mdef.foreground, item))
        + renderer.markGroup(item)
        + closeTag('g');
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

prototype.markGroup = function(scene) {
  var renderer = this,
      str = '';

  visit(scene, function(item) {
    str += renderer.mark(item);
  });

  return str;
};

function applyStyles(o, mark, tag, defs) {
  if (o == null) return '';
  var i, n, prop, name, value, s = '';

  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none; ';
  }

  if (tag === 'text') {
    s += 'font-family: ' + fontFamily(o) + '; ';
    s += 'font-size: ' + fontSize(o) + 'px; ';
    if (o.fontStyle) s += 'font-style: ' + o.fontStyle + '; ';
    if (o.fontVariant) s += 'font-variant: ' + o.fontVariant + '; ';
    if (o.fontWeight) s += 'font-weight: ' + o.fontWeight + '; ';
  }

  for (i=0, n=styleProperties.length; i<n; ++i) {
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
      if (value.id) {
        // ensure definition is included
        defs.gradient[value.id] = value;
        value = 'url(#' + value.id + ')';
      }
      s += name + ': ' + value + '; ';
    }
  }

  return s ? 'style="' + s.trim() + '"' : null;
}

function escape_text(s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

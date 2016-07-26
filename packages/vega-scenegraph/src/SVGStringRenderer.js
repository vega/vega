import Renderer from './Renderer';
import marks from './marks/index';

import inherits from './util/inherits';
import {cssClass} from './util/dom';
import {openTag, closeTag} from './util/tags';
import {font, textValue} from './util/text';
import metadata from './util/svg/metadata';
import {styles, styleProperties} from './util/svg/styles';

export default function SVGStringRenderer(loadConfig) {
  Renderer.call(this, loadConfig);

  this._text = {
    head: '',
    root: '',
    foot: '',
    defs: '',
    body: ''
  };

  this._defs = {
    clip_id:  1,
    gradient: {},
    clipping: {}
  };
}

var prototype = inherits(SVGStringRenderer, Renderer);
var base = Renderer.prototype;

prototype.resize = function(width, height, padding) {
  base.resize.call(this, width, height, padding);
  var p = this._padding,
      t = this._text;

  var attr = {
    'class':  'marks',
    'width':  this._width + p.left + p.right,
    'height': this._height + p.top + p.bottom
  };
  for (var key in metadata) {
    attr[key] = metadata[key];
  }

  t.head = openTag('svg', attr);
  t.root = openTag('g', {
    transform: 'translate(' + p.left + ',' + p.top + ')'
  });
  t.foot = closeTag('g') + closeTag('svg');

  return this;
};

prototype.svg = function() {
  var t = this._text;
  return t.head + t.defs + t.root + t.body + t.foot;
};

prototype.render = function(scene) {
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
  return this;
};

prototype.reset = function() {
  this._defs.clip_id = 0;
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

    defs += openTag('rect', {
      x: 0,
      y: 0,
      width: def.width,
      height: def.height
    }) + closeTag('rect');

    defs += closeTag('clipPath');
  }

  return (defs.length > 0) ? openTag('defs') + defs + closeTag('defs') : '';
};

prototype.imageURL = function(url) {
  return this._loader.imageURL(url);
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

prototype.mark = function(scene) {
  var mdef = marks[scene.marktype],
      tag  = mdef.tag,
      attr = mdef.attr,
      nest = mdef.nested || false,
      data = nest ?
          (scene.items && scene.items.length ? [scene.items[0]] : []) :
          (scene.items || []),
      defs = this._defs,
      str = '',
      style, i, item;

  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }

  // render opening group tag
  str += openTag('g', {
    'class': cssClass(scene)
  }, style);

  // render contained elements
  for (i=0; i<data.length; ++i) {
    item = data[i];
    style = (tag !== 'g') ? applyStyles(item, scene, tag, defs) : null;
    str += openTag(tag, this.attributes(attr, item), style);

    if (tag === 'text') {
      str += escape_text(textValue(item.text));
    } else if (tag === 'g') {
      str += openTag('path',
        this.attributes(mdef.background, item),
        applyStyles(item, scene, 'bgrect', defs)) + closeTag('path');
      str += this.markGroup(item);
    }

    str += closeTag(tag);
  }

  // render closing group tag
  return str + closeTag('g');
};

prototype.markGroup = function(scene) {
  var str = '',
      items = scene.items || [],
      j, m;

  for (j=0, m=items.length; j<m; ++j) {
    str += this.mark(items[j]);
  }

  return str;
};

function applyStyles(o, mark, tag, defs) {
  if (o == null) return '';
  var i, n, prop, name, value, s = '';

  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none;';
  }

  if (tag === 'text') {
    s += 'font: ' + font(o) + ';';
  }

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    name = styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === 'fill') {
        s += (s.length ? ' ' : '') + 'fill: none;';
      }
    } else {
      if (value.id) {
        // ensure definition is included
        defs.gradient[value.id] = value;
        value = 'url(#' + value.id + ')';
      }
      s += (s.length ? ' ' : '') + name + ': ' + value + ';';
    }
  }

  return s ? 'style="' + s + '"' : null;
}

function escape_text(s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

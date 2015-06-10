var dl = require('datalib'),
    openTag = require('../../util/xml').openTag,
    closeTag = require('../../util/xml').closeTag,
    fontString = require('../../util/font-string'),
    ImageLoader = require('../../util/ImageLoader'),
    svg = require('../../util/svg');

function SVGStringBuilder(loadConfig) {
  this._loader = new ImageLoader(loadConfig);
  this._text = {
    head: '',
    root: '',
    foot: '',
    defs: '',
    body: ''
  };
  this._defs = {
    group_id: 0,
    clip_id:  0,
    gradient: {},
    clipping: {}
  };
}

var prototype = SVGStringBuilder.prototype;

prototype.initialize = function(w, h, pad) {
  var t = this._text;

  t.head = openTag('svg', dl.extend({
    'class':  'marks',
    'width':  w + pad.left + pad.right,
    'height': h + pad.top + pad.bottom
  }, svg.metadata));

  t.root = openTag('g', {
    transform: 'translate(' + pad.left + ',' + pad.top + ')'
  });

  t.foot = closeTag('g') + closeTag('svg');
};

prototype.svg = function() {
  var t = this._text;
  return t.head + t.defs + t.root + t.body + t.foot;
};

prototype.render = function(scene) {
  this._defs.group_id = 0; // reset the group counter
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
};

prototype.reset = function() {
  this._defs.clip_id = 0;
  this._defs.group_id = 0;
  return this;
};

prototype.buildDefs = function() {
  var all = this._defs,
      dgrad = dl.keys(all.gradient),
      dclip = dl.keys(all.clipping),
      defs = '',
      i, j, id, def, stops;

  for (i=0; i<dgrad.length; ++i) {
    id = dgrad[i];
    def = all.gradient[id];
    stops = def.stops;

    defs += openTag('lineargradient', {
      id: id,
      x1: def.x1,
      x2: def.x2,
      y1: def.y1,
      y2: def.y2
    });
    
    for (j=0; j<stops.length; ++j) {
      defs += openTag('stop', {
        offset: stops[j].offset,
        'stop-color': stops[j].color
      }) + closeTag('stop');
    }
    
    defs += closeTag('lineargradient');
  }
  
  for (i=0; i<dclip.length; ++i) {
    id = dclip[i];
    def = all.clipping[id];

    defs += openTag('clippath', {id: id});

    defs += openTag('rect', {
      x: 0,
      y: 0,
      width: def.width,
      height: def.height
    }) + closeTag('rect');

    defs += closeTag('clippath');
  }
  
  return (defs.length > 0) ? openTag('defs') + defs + closeTag('defs') : '';
};

prototype.mark = function(scene) {
  var meta = MARKS[scene.marktype];
  if (!meta) return null; // unknown marktype

  var tag  = meta[0],
      attr = meta[1],
      nest = meta[2] || false,
      data = nest ? [scene.items] : (scene.items || []),
      defs = this._defs,
      className = cssClass(scene),
      str = '',
      style, i;

  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }

  // render opening group tag
  str += openTag('g', {
    'id':    'g' + (this._defs.group_id++), // d3 dom compat
    'class': className
  }, style);

  // render contained elements
  for (i=0; i<data.length; ++i) {
    style = (tag === 'g') ? null : styles(data[i], scene, tag, defs);
    str += openTag(tag, attr(data[i], defs), style);
    if (tag === 'text') {
      str += escape_text(data[i].text);
    } else if (tag === 'g') {
      str += group_bg(data[i], styles(data[i], scene, 'bgrect', defs));
      str += this.markGroup(data[i]);
    }
    str += closeTag(tag);
  }

  // render closing group tag
  return str + closeTag('g');
};

prototype.markGroup = function(scene) {
  var str = '',
      axes = scene.axisItems || [],
      items = scene.items || [],
      legends = scene.legendItems || [],
      j, m;

  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer === 'back') {
      str += this.mark(axes[j]);
    }
  }
  for (j=0, m=items.length; j<m; ++j) {
    str += this.mark(items[j]);
  }
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer !== 'back') {
      str += this.mark(axes[j]);
    }
  }
  for (j=0, m=legends.length; j<m; ++j) {
    str += this.mark(legends[j]);
  }

  return str;
};

var MARKS = {
  group:  ['g', group],
  area:   ['path', area, true],
  line:   ['path', line, true],
  arc:    ['path', arc],
  path:   ['path', path],
  symbol: ['path', symbol],
  rect:   ['rect', rect],
  rule:   ['line', rule],
  text:   ['text', text],
  image:  ['image', image]
};

function cssClass(mark) {
  return 'type-' + mark.marktype + (mark.name ? ' '+mark.name : '');
}

function styles(d, mark, tag, defs) {
  var i, n, prop, name, value,
      o = dl.isArray(d) ? d[0] : d;
  if (o == null) return '';

  var s = '';

  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none;';
  }

  if (tag === 'text') {
    s += (s.length ? ' ' : '') + 'font: ' + fontString(o) + ';';
  }

  for (i=0, n=svg.styleProperties.length; i<n; ++i) {
    prop = svg.styleProperties[i];
    name = svg.styles[prop];
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
  s = (s == null ? '' : String(s));
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

function group_bg(o, style) {
  return openTag('rect', {
    'class': 'background',
    width: o.width || 0,
    height: o.height || 0
  }, style) + closeTag('rect');
}

function group(o, defs) {
  var x = o.x || 0,
      y = o.y || 0,
      attr = {transform: 'translate('+x+','+y+')'},
      id, c;

  if (o.clip) {
    id = o.clip_id || (o.clip_id = 'clip' + defs.clip_id++);
    c = {
      width:  o.width || 0,
      height: o.height || 0
    };
        
    defs.clipping[id] = c;
    attr['clip-path'] = 'url(#' + id + ')';
  }

  return attr;
}

function arc(o) {
  var x = o.x || 0,
      y = o.y || 0;
  return {
    transform: 'translate('+x+','+y+')',
    d: svg.path.arc(o)
  };
}

function area(items) {
  if (!items.length) return null;
  var o = items[0];
  var path = (o.orient === 'horizontal' ? svg.path.areah : svg.path.areav)
    .interpolate(o.interpolate || 'linear')
    .tension(o.tension == null ? 0.7 : o.tension);
  return {d: path(items)};
}

function line(items) {
  if (!items.length) return null;
  var o = items[0];
  svg.path.line
    .interpolate(o.interpolate || 'linear')
    .tension(o.tension == null ? 0.7 : o.tension);
  return {d: svg.path.line(items)};
}

function path(o) {
  var x = o.x || 0,
      y = o.y || 0;
  return {
    transform: 'translate('+x+','+y+')',
    d: o.path
  };
}

function rect(o) {
  return {
    x: o.x || 0,
    y: o.y || 0,
    width: o.width || 0,
    height: o.height || 0
  };
}

function rule(o) {
  var x1 = o.x || 0,
      y1 = o.y || 0;
  return {
    x1: x1,
    y1: y1,
    x2: o.x2 != null ? o.x2 : x1,
    y2: o.y2 != null ? o.y2 : y1
  };
}

function symbol(o) {
  var x = o.x || 0,
      y = o.y || 0;
  return {
    transform: 'translate('+x+','+y+')',
    d: svg.path.symbol(o)
  };
}

function image(o) {
  var x = o.x || 0,
      y = o.y || 0,
      w = o.width || 0,
      h = o.height || 0,
      url = ImageLoader.imageURL(o.url);

  x = x - (o.align === 'center' ? w/2 : o.align === 'right' ? w : 0);
  y = y - (o.baseline === 'middle' ? h/2 : o.baseline === 'bottom' ? h : 0);

  return {
    'xlink:href': url,
    x: x,
    y: y,
    width: w,
    height: h
  };
}

function text(o) {
  var x = o.x || 0,
      y = o.y || 0,
      dx = o.dx || 0,
      dy = o.dy || 0,
      a = o.angle || 0,
      r = o.radius || 0,
      align = svg.textAlign[o.align || 'left'],
      base = o.baseline==='top' ? '.9em' : o.baseline==='middle' ? '.35em' : 0;

  if (r) {
    var t = (o.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  return {
    x: x + dx,
    y: y + dy,
    'text-anchor': align,
    transform: a ? 'rotate('+a+' '+x+','+y+')' : null,
    dy: base ? base : null
  };
}

module.exports = SVGStringBuilder;

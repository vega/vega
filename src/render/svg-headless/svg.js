var d3 = require('d3'),
    dl = require('datalib'),
    config = require('../../util/config');

var renderer = function() {
  this._gid = 0; // group id counter for d3 dom compat
  this._text = {
    head: "",
    root: "",
    foot: "",
    defs: "",
    body: ""
  };
  this._defs = {
    gradient: {},
    clipping: {}
  };
};

function open(tag, attr, raw) {
  var s = "<" + tag;
  if (attr) {
    for (var key in attr) {
      var val = attr[key];
      if (val != null) {
        s += " " + key + '="' + val + '"';
      }
    }
  }
  if (raw) s += " " + raw;
  return s + ">";
}

function close(tag) {
  return "</" + tag + ">";
}

var prototype = renderer.prototype;

prototype.initialize = function(el, w, h, pad) {
  var t = this._text;

  t.head = open('svg', {
    "class": 'marks',
    width: w + pad.left + pad.right,
    height: h + pad.top + pad.bottom,
  }, config.svgNamespace);

  t.root = open('g', {
    transform: 'translate(' + pad.left + ',' + pad.top + ')'
  });

  t.foot = close('g') + close('svg');
};

prototype.svg = function() {
  var t = this._text;
  return t.head + t.defs + t.root + t.body + t.foot;
};

prototype.buildDefs = function() {
  var all = this._defs,
      dgrad = dl.keys(all.gradient),
      dclip = dl.keys(all.clipping),
      defs = "", grad, clip, i, j;

  for (i=0; i<dgrad.length; ++i) {
    var id = dgrad[i],
        def = all.gradient[id],
        stops = def.stops;

    defs += open("linearGradient", {
      id: id,
      x1: def.x1,
      x2: def.x2,
      y1: def.y1,
      y2: def.y2
    });
    
    for (j=0; j<stops.length; ++j) {
      defs += open("stop", {
        offset: stops[j].offset,
        "stop-color": stops[j].color
      }) + close("stop");
    }
    
    defs += close("linearGradient");
  }
  
  for (i=0; i<dclip.length; ++i) {
    var id = dclip[i],
        def = all.clipping[id];

    defs += open("clipPath", {id: id});

    defs += open("rect", {
      x: 0,
      y: 0,
      width: def.width,
      height: def.height
    }) + close("rect");

    defs += close("clipPath");
  }
  
  if (defs.length > 0) {
    return open("defs") + defs + close("defs");
  } else {
    return ""
  }
  return defs;
};

prototype.render = function(scene) {
  this._gid = 0; // reset the group counter
  this._text.body = this.draw(scene);
  this._text.defs = this.buildDefs();
};

prototype.draw = function(scene) {
  var meta = MARKS[scene.marktype];
  if (!meta) {
    return; // no known marktype (e.g., an interactor)
  }
  var tag  = meta[0],
      attr = meta[1],
      nest = meta[2] || false,
      data = nest ? [scene.items] : scene.items,
      defs = this._defs,
      svg = "", i, sty;

  var cls = cssClass(scene.def);

  // style literals to exactly match the d3 dom
  var styl = null;
  if (cls === 'type-rule' || cls === 'type-path')
    styl = 'style="pointer-events: none;"';
  else if (cls !== 'type-group')
    styl = 'style=""';

  svg += open('g', {
    'id': 'g' + ++this._gid, // d3 dom compat
    'class': cssClass(scene.def)
  }, styl);

  for (i=0; i<data.length; ++i) {
    var sty = tag === 'g' ? null : style(data[i], tag, defs);
    svg += open(tag, attr(data[i], defs), sty);
    if (tag === 'text') svg += escape_text(data[i].text);
    if (tag === 'g') svg += this.drawGroup(data[i]);
    svg += close(tag);
  }

  return svg + close('g');
};

function escape_text(s) {
  s = (s == null ? "" : String(s));
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

function escape_font(s) {
  return String(s).replace(/\"/g, "'");
}

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

prototype.drawGroup = function(scene) {
  var svg = "",
      axes = scene.axisItems || [],
      items = scene.items,
      legends = scene.legendItems || [],
      i, j, m;

  svg += group_bg(scene);

  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].def.layer === "back") {
      svg += this.draw(axes[j]);
    }
  }
  for (j=0, m=items.length; j<m; ++j) {
    svg += this.draw(items[j]);
  }
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].def.layer !== "back") {
      svg += this.draw(axes[j]);
    }
  }
  for (j=0, m=legends.length; j<m; ++j) {
    svg += this.draw(legends[j]);
  }

  return svg;
};

///

function group_bg(o) {
  var w = o.width || 0,
      h = o.height || 0;

  var styl = o.mark.interactive === false ?
    'style="pointer-events: none;"' : 
    'style=""';

  return open('rect', {
    'class': 'background'
  }, styl) + close('rect');
}

function group(o, defs) {
  var x = o.x || 0,
      y = o.y || 0,
      attr = {transform: "translate("+x+","+y+")"};

  if (o.clip) {
    var c = {width: o.width || 0, height: o.height || 0},
        id = o.clip_id || (o.clip_id = "clip" + clip_id++);
    defs.clipping[id] = c;
    attr["clip-path"] = "url(#"+id+")";
  }

  return attr;
}

function arc(o) {
  var x = o.x || 0,
      y = o.y || 0;
  return {
    transform: "translate("+x+","+y+")",
    d: arc_path(o)
  };
}

function area(items) {
  if (!items.length) return;
  var o = items[0],
      path = o.orient === "horizontal" ? area_path_h : area_path_v;
  path
    .interpolate(o.interpolate || "linear")
    .tension(o.tension == null ? 0.7 : o.tension);
  return {d: path(items)};
}

function line(items) {
  if (!items.length) return;
  var o = items[0];
  line_path
    .interpolate(o.interpolate || "linear")
    .tension(o.tension == null ? 0.7 : o.tension);
  return {d: line_path(items)};
}

function path(o) {
  var x = o.x || 0,
      y = o.y || 0;
  return {
    transform: "translate("+x+","+y+")",
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
    transform: "translate("+x+","+y+")",
    d: symbol_path(o)
  };
}

function image(o) {
  var w = o.width || (o.image && o.image.width) || 0,
      h = o.height || (o.image && o.image.height) || 0,
      x = o.x - (o.align === "center"
        ? w/2 : (o.align === "right" ? w : 0)),
      y = o.y - (o.baseline === "middle"
        ? h/2 : (o.baseline === "bottom" ? h : 0)),
      url = config.baseURL + o.url;
  
  return {
    "xlink:href": url,
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
      align = textAlign[o.align || "left"],
      base = o.baseline==="top" ? ".9em"
           : o.baseline==="middle" ? ".35em" : 0;

  if (r) {
    var t = (o.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  return {
    x: x + dx,
    y: y + dy,
    'text-anchor': align,
    transform: a ? "rotate("+a+" "+x+","+y+")" : null,
    dy: base ? base : null
  };
}

///

function cssClass(def) {
  var cls = "type-" + def.type;
  if (def.name) cls += " " + def.name;
  return cls;
}

function x(o)     { return o.x || 0; }
function y(o)     { return o.y || 0; }
function xw(o)    { return o.x + o.width || 0; }
function yh(o)    { return o.y + o.height || 0; }
function key(o)   { return o.key; }
function size(o)  { return o.size==null ? 100 : o.size; }
function shape(o) { return o.shape || "circle"; }

var arc_path    = d3.svg.arc(),
    area_path_v = d3.svg.area().x(x).y1(y).y0(yh),
    area_path_h = d3.svg.area().y(y).x0(xw).x1(x),
    line_path   = d3.svg.line().x(x).y(y),
    symbol_path = d3.svg.symbol().type(shape).size(size);

var mark_id = 0,
    clip_id = 0;

var textAlign = {
  "left":   "start",
  "center": "middle",
  "right":  "end"
};

var styles = {
  "fill":             "fill",
  "fillOpacity":      "fill-opacity",
  "stroke":           "stroke",
  "strokeWidth":      "stroke-width",
  "strokeOpacity":    "stroke-opacity",
  "strokeCap":        "stroke-linecap",
  "strokeDash":       "stroke-dasharray",
  "strokeDashOffset": "stroke-dashoffset",
  "opacity":          "opacity"
};

var styleProps = dl.keys(styles);

function style(d, tag, defs) {
  var i, n, prop, name, value,
      o = d.mark ? d : d.length ? d[0] : null;
  if (o === null) return null;

  var s = "";

  if (tag === 'text') {
    s += 'font: ' + fontString(o) + ';';
  }
  
  for (i=0, n=styleProps.length; i<n; ++i) {
    prop = styleProps[i];
    name = styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === "fill") s += 'fill: none;';
    } else {
      if (value.id) {
        // ensure definition is included
        defs.gradient[value.id] = value;
        value = "url(" + window.location.href + "#" + value.id + ")";
      }
      s += (s.length ? ' ' : '') + name + ': ' + value + ';'
    }
  }
  
  // not that we don't exclude blank styles for d3 dom compat
  return 'style="'+s+'"';
}

function fontString(o) {
  var f = (o.fontStyle ? o.fontStyle + " " : "")
    + (o.fontVariant ? o.fontVariant + " " : "")
    + (o.fontWeight ? o.fontWeight + " " : "")
    + (o.fontSize != null ? o.fontSize : config.render.fontSize) + "px "
    + (o.font && escape_font(o.font) || config.render.font);
  return f;
}

module.exports = renderer;

var dl = require('datalib'),
    d3 = require('d3'),
    config = require('../../util/config');

function x(o)     { return o.x || 0; }
function y(o)     { return o.y || 0; }
function yh(o)    { return o.y + o.height || 0; }
function key(o)   { return o.key; }
function size(o)  { return o.size==null ? 100 : o.size; }
function shape(o) { return o.shape || "circle"; }
    
var arc_path    = d3.svg.arc(),
    area_path   = d3.svg.area().x(x).y1(y).y0(yh),
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

function style(d) {
  var i, n, prop, name, value,
      o = d.mark ? d : d.length ? d[0] : null;
  if (o === null) return;

  for (i=0, n=styleProps.length; i<n; ++i) {
    prop = styleProps[i];
    name = styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === "fill") this.style.setProperty(name, "none", null);
      else this.style.removeProperty(name);
    } else {
      if (value.id) {
        // ensure definition is included
        marks.current._defs.gradient[value.id] = value;
        value = "url(#" + value.id + ")";
      }
      this.style.setProperty(name, value+"", null);
    }
  }
}

function arc(o) {
  var x = o.x || 0,
      y = o.y || 0;
  this.setAttribute("transform", "translate("+x+","+y+")");
  this.setAttribute("d", arc_path(o));
}

function area(items) {
  if (!items.length) return;
  var o = items[0];
  area_path
    .interpolate(o.interpolate || "linear")
    .tension(o.tension == null ? 0.7 : o.tension);
  this.setAttribute("d", area_path(items));
}

function line(items) {
  if (!items.length) return;
  var o = items[0];
  line_path
    .interpolate(o.interpolate || "linear")
    .tension(o.tension == null ? 0.7 : o.tension);
  this.setAttribute("d", line_path(items));
}

function path(o) {
  var x = o.x || 0,
      y = o.y || 0;
  this.setAttribute("transform", "translate("+x+","+y+")");
  if (o.path != null) this.setAttribute("d", o.path);
}

function rect(o) {
  this.setAttribute("x", o.x || 0);
  this.setAttribute("y", o.y || 0);
  this.setAttribute("width", o.width || 0);
  this.setAttribute("height", o.height || 0);
}

function rule(o) {
  var x1 = o.x || 0,
      y1 = o.y || 0;
  this.setAttribute("x1", x1);
  this.setAttribute("y1", y1);
  this.setAttribute("x2", o.x2 != null ? o.x2 : x1);
  this.setAttribute("y2", o.y2 != null ? o.y2 : y1);
}

function symbol(o) {
  var x = o.x || 0,
      y = o.y || 0;
  this.setAttribute("transform", "translate("+x+","+y+")");
  this.setAttribute("d", symbol_path(o));
}

function image(o) {
  var w = o.width || (o.image && o.image.width) || 0,
      h = o.height || (o.image && o.image.height) || 0,
      x = o.x - (o.align === "center"
        ? w/2 : (o.align === "right" ? w : 0)),
      y = o.y - (o.baseline === "middle"
        ? h/2 : (o.baseline === "bottom" ? h : 0)),
      url = config.baseURL + o.url;
  
  this.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
  this.setAttribute("x", x);
  this.setAttribute("y", y);
  this.setAttribute("width", w);
  this.setAttribute("height", h);
}
  
function fontString(o) {
  return (o.fontStyle ? o.fontStyle + " " : "")
    + (o.fontVariant ? o.fontVariant + " " : "")
    + (o.fontWeight ? o.fontWeight + " " : "")
    + (o.fontSize != null ? o.fontSize : config.render.fontSize) + "px "
    + (o.font || config.render.font);
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

  this.setAttribute("x", x + dx);
  this.setAttribute("y", y + dy);
  this.setAttribute("text-anchor", align);
  
  if (a) this.setAttribute("transform", "rotate("+a+" "+x+","+y+")");
  else this.removeAttribute("transform");
  
  if (base) this.setAttribute("dy", base);
  else this.removeAttribute("dy");
  
  this.textContent = o.text;
  this.style.setProperty("font", fontString(o), null);
}

function group(o) {
  var x = o.x || 0,
      y = o.y || 0;
  this.setAttribute("transform", "translate("+x+","+y+")");

  if (o.clip) {
    var c = {width: o.width || 0, height: o.height || 0},
        id = o.clip_id || (o.clip_id = "clip" + clip_id++);
    marks.current._defs.clipping[id] = c;
    this.setAttribute("clip-path", "url(#"+id+")");
  }
}

function group_bg(o) {
  var w = o.width || 0,
      h = o.height || 0;
  this.setAttribute("width", w);
  this.setAttribute("height", h);
}

function cssClass(def) {
  var cls = "type-" + def.type;
  if (def.name) cls += " " + def.name;
  return cls;
}

function draw(tag, attr, nest) {
  return function(g, scene, index) {
    drawMark(g, scene, index, "mark_", tag, attr, nest);
  };
}

function drawMark(g, scene, index, prefix, tag, attr, nest) {
  var data = nest ? [scene.items] : scene.items,
      evts = scene.interactive===false ? "none" : null,
      grps = g.node().childNodes,
      notG = (tag !== "g"),
      p = (p = grps[index+1]) // +1 to skip group background rect
        ? d3.select(p)
        : g.append("g")
           .attr("id", "g"+(++mark_id))
           .attr("class", cssClass(scene.def));

  var id = p.attr("id"),
      s = "#" + id + " > " + tag,
      m = p.selectAll(s).data(data),
      e = m.enter().append(tag);

  if (notG) {
    p.style("pointer-events", evts);
    e.each(function(d) {
      if (d.mark) d._svg = this;
      else if (d.length) d[0]._svg = this;
    });
  } else {
    e.append("rect").attr("class","background").style("pointer-events",evts);
  }
  
  m.exit().remove();
  m.each(attr);
  if (notG) m.each(style);
  else p.selectAll(s+" > rect.background").each(group_bg).each(style);
  
  return p;
}

function drawGroup(g, scene, index, prefix) {    
  var p = drawMark(g, scene, index, prefix || "group_", "g", group),
      c = p.node().childNodes, n = c.length, i, j, m;
  
  for (i=0; i<n; ++i) {
    var items = c[i].__data__.items,
        legends = c[i].__data__.legendItems || [],
        axes = c[i].__data__.axisItems || [],
        sel = d3.select(c[i]),
        idx = 0;

    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].def.layer === "back") {
        drawGroup.call(this, sel, axes[j], idx++, "axis_");
      }
    }
    for (j=0, m=items.length; j<m; ++j) {
      this.draw(sel, items[j], idx++);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].def.layer !== "back") {
        drawGroup.call(this, sel, axes[j], idx++, "axis_");
      }
    }
    for (j=0, m=legends.length; j<m; ++j) {
      drawGroup.call(this, sel, legends[j], idx++, "legend_");
    }
  }
}

var marks = module.exports = {
  update: {
    group:   rect,
    area:    area,
    line:    line,
    arc:     arc,
    path:    path,
    symbol:  symbol,
    rect:    rect,
    rule:    rule,
    text:    text,
    image:   image
  },
  nested: {
    "area": true,
    "line": true
  },
  style: style,
  draw: {
    group:   drawGroup,
    area:    draw("path", area, true),
    line:    draw("path", line, true),
    arc:     draw("path", arc),
    path:    draw("path", path),
    symbol:  draw("path", symbol),
    rect:    draw("rect", rect),
    rule:    draw("line", rule),
    text:    draw("text", text),
    image:   draw("image", image),
    draw:    draw // expose for extensibility
  },
  current: null
};
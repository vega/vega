vg.svg.marks = (function() {

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
  
  var textAlign = {
    "left":   "start",
    "center": "middle",
    "right":  "end"
  };
  
  var styles = {
    "fill":          "fill",
    "fillOpacity":   "fill-opacity",
    "stroke":        "stroke",
    "strokeWidth":   "stroke-width",
    "strokeOpacity": "stroke-opacity",
    "opacity":       "opacity"
  };
  
  var styleProps = vg.keys(styles);
  
  function style(d) {
    var o = d.mark ? d : d[0],
        i, n, prop, name, value;
    for (i=0, n=styleProps.length; i<n; ++i) {
      prop = styleProps[i];
      name = styles[prop];
      value = o[prop];
      if (value == null) {
        if (name === "fill") this.style.setProperty(name, "none", null);
        else this.style.removeProperty(name);
      }
      else this.style.setProperty(name, value, null);
    }
  }
  
  function arc(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", arc_path(o));
  }
  
  function area(items) {
    var o = items[0];
    area_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == undefined ? 0.7 : o.tension);
    this.setAttribute("d", area_path(items));
  }
  
  function line(items) {
    var o = items[0];
    line_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == undefined ? 0.7 : o.tension);
    this.setAttribute("d", line_path(items));
  }
  
  function path(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", o.path);
  }

  function rect(o) {
    this.setAttribute("x", o.x || 0);
    this.setAttribute("y", o.y || 0);
    this.setAttribute("width", o.width || 0);
    this.setAttribute("height", o.height || 0);
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
          ? h/2 : (o.baseline === "bottom" ? h : 0));
    
    this.setAttributeNS("http://www.w3.org/1999/xlink", "href", o.url);
    this.setAttribute("x", x);
    this.setAttribute("y", y);
    this.setAttribute("width", w);
    this.setAttribute("height", h);
  }
    
  function fontString(o) {
    return (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + (o.fontSize != undefined ? o.fontSize + "px " : "11px ")
      + (o.font || "sans-serif");
  }
  
  function text(o) {
    var x = o.x || 0,
        y = o.y || 0,
        dx = o.dx || 0,
        dy = o.dy || 0,
        a = o.angle || 0,
        align = textAlign[o.align || "left"],
        base = o.baseline==="top" ? ".9em"
             : o.baseline==="middle" ? ".35em" : 0;
  
    this.setAttribute("x", x + dx);
    this.setAttribute("y", y + dy);
    this.setAttribute("dy", dy);
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
  }

  function draw(tag, attr, nest) {
    return function(g, scene, index) {
      drawMark(g, scene, index, "mark_", tag, attr, nest);
    };
  }
  
  var mark_id = 0;
  
  function drawMark(g, scene, index, prefix, tag, attr, nest) {
    var className = prefix + index,
        data = nest ? [scene.items] : scene.items,
        p = g.select("."+className);

    if (p.empty()) p = g.append("g")
      .attr("id", "g"+(++mark_id))
      .attr("class", className);

    var id = "#" + p.attr("id");
    var m = p.selectAll(id+" > "+tag).data(data);  
    var e = m.enter().append(tag);
    if (tag !== "g") {
      p.style("pointer-events", scene.interactive===false ? "none" : null);
      e.each(function(d) { (d.mark ? d : d[0])._svg = this; });
    }
    
    m.exit().remove();
    m.each(attr);
    if (tag !== "g") m.each(style);
  }

  function drawGroup(g, scene, index) {
    var renderer = this;
        
    drawMark(g, scene, index, "mark_", "rect", rect);
    drawMark(g, scene, index, "group_", "g", group);

    var x = g.select(".group_"+index).node(), i, n, j, m;
    for (var i=0, n=x.childNodes.length; i<n; ++i) {
      var sel = d3.select(x.childNodes[i]),
          items = x.childNodes[i].__data__.items;
      for (var j=0, m=items.length; j<m; ++j) {
        renderer.draw(sel, items[j], j);
      }
    }
  }

  return {
    update: {
      group:   rect,
      area:    area,
      line:    line,
      arc:     arc,
      path:    path,
      symbol:  symbol,
      rect:    rect,
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
      text:    draw("text", text),
      image:   draw("image", image),
      draw:    draw // expose for extensibility
    }
  };
  
})();
vg.svg.Renderer = (function() {
  var renderer = function() {
    this._svg = null;
    this._ctx = null;
    this._el = null;
    this._defs = {
      gradient: {},
      clipping: {}
    };
  };
  
  var prototype = renderer.prototype;
  
  prototype.initialize = function(el, width, height, pad, bgcolor) {
    this._el = el;

    // remove any existing svg element
    d3.select(el).select("svg.marks").remove();

    // create svg element and initialize attributes
    this._svg = d3.select(el)
      .append("svg")
      .attr("class", "marks");

    if (bgcolor != null) {
      this._svg.style("background-color", bgcolor);
    }
    
    // set the svg root group
    this._ctx = this._svg.append("g");
    
    return this.resize(width, height, pad);
  };
  
  prototype.resize = function(width, height, pad) {
    this._width = width;
    this._height = height;
    this._padding = pad;
    
    this._svg
      .attr("width", width + pad.left + pad.right)
      .attr("height", height + pad.top + pad.bottom);
      
    this._ctx
      .attr("transform", "translate("+pad.left+","+pad.top+")");

    return this;
  };
  
  prototype.context = function() {
    return this._ctx;
  };
  
  prototype.element = function() {
    return this._el;
  };

  prototype.updateDefs = function() {
    var svg = this._svg,
        all = this._defs,
        dgrad = vg.keys(all.gradient),
        dclip = vg.keys(all.clipping),
        defs = svg.select("defs"), grad, clip;
  
    // get or create svg defs block
    if (dgrad.length===0 && dclip.length==0) { defs.remove(); return; }
    if (defs.empty()) defs = svg.insert("defs", ":first-child");
    
    grad = defs.selectAll("linearGradient").data(dgrad, vg.identity);
    grad.enter().append("linearGradient").attr("id", vg.identity);
    grad.exit().remove();
    grad.each(function(id) {
      var def = all.gradient[id],
          grd = d3.select(this);
  
      // set gradient coordinates
      grd.attr({x1: def.x1, x2: def.x2, y1: def.y1, y2: def.y2});
  
      // set gradient stops
      stop = grd.selectAll("stop").data(def.stops);
      stop.enter().append("stop");
      stop.exit().remove();
      stop.attr("offset", function(d) { return d.offset; })
          .attr("stop-color", function(d) { return d.color; });
    });
    
    clip = defs.selectAll("clipPath").data(dclip, vg.identity);
    clip.enter().append("clipPath").attr("id", vg.identity);
    clip.exit().remove();
    clip.each(function(id) {
      var def = all.clipping[id],
          cr = d3.select(this).selectAll("rect").data([1]);
      cr.enter().append("rect");
      cr.attr("x", 0)
        .attr("y", 0)
        .attr("width", def.width)
        .attr("height", def.height);
    });
  };
  
  prototype.render = function(scene, items) {
    vg.svg._cur = this;

    if (items) {
      this.renderItems(vg.array(items));
    } else {
      this.draw(this._ctx, scene, -1);
    }
    this.updateDefs();

   delete vg.svg._cur;
  };
  
  prototype.renderItems = function(items) {
    var item, node, type, nest, i, n,
        marks = vg.svg.marks;

    for (i=0, n=items.length; i<n; ++i) {
      item = items[i];
      node = item._svg;
      type = item.mark.marktype;

      item = marks.nested[type] ? item.mark.items : item;
      marks.update[type].call(node, item);
      marks.style.call(node, item);
    }
  };
  
  prototype.draw = function(ctx, scene, index) {
    var marktype = scene.marktype,
        renderer = vg.svg.marks.draw[marktype];
    renderer.call(this, ctx, scene, index);
  };
  
  return renderer;
})();
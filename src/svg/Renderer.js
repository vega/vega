vg.svg.Renderer = (function() {  
  var renderer = function() {
    this._svg = null;
    this._ctx = null;
    this._el = null;
    this._defs = {};
  };
  
  var prototype = renderer.prototype;
  
  prototype.initialize = function(el, width, height, pad) {
    this._el = el;
    this._width = width;
    this._height = height;

    // remove any existing svg element
    d3.select(el).select("svg.marks").remove();

    // create svg element and initialize attributes
    this._svg = d3.select(el)
      .append("svg")
      .attr("class", "marks");
    
    // set the svg root group
    this._ctx = this._svg.append("g");
    
    return this.padding(pad);
  };
  
  prototype.padding = function(pad) {
    this._padding = pad;
    
    this._svg
      .attr("width", this._width + pad.left + pad.right)
      .attr("height", this._height + pad.top + pad.bottom);
      
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
        ids = vg.keys(all),
        defs = svg.select("defs"), grds;
  
    // get or create svg defs block
    if (ids.length===0) { defs.remove(); return; }
    if (defs.empty()) defs = svg.insert("defs", ":first-child");
    
    grds = defs.selectAll("linearGradient").data(ids, vg.identity);
    grds.enter().append("linearGradient").attr("id", vg.identity);
    grds.exit().remove();
    grds.each(function(id) {
      var def = all[id],
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
  };
  
  prototype.render = function(scene, items) {
    vg.svg._cur = this;

    if (items) this.renderItems(vg.array(items));
    else this.draw(this._ctx, scene, -1);
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
  }
  
  prototype.draw = function(ctx, scene, index) {
    var marktype = scene.marktype,
        renderer = vg.svg.marks.draw[marktype];
    renderer.call(this, ctx, scene, index);
  };
  
  return renderer;
})();
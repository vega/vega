vg.svg.Renderer = (function() {  
  var renderer = function() {
    this._ctx = null;
    this._el = null;
  };
  
  var prototype = renderer.prototype;
  
  prototype.initialize = function(el, width, height, pad) {
    this._el = el;
    this._width = width;
    this._height = height;
    this._padding = pad;

    // remove any existing svg element
    d3.select(el).select("svg.marks").remove();

    // create svg element and initialize attributes
    var svg = d3.select(el)
      .append("svg")
      .attr("class", "marks")
      .attr("width", width + pad.left + pad.right)
      .attr("height", height + pad.top + pad.bottom);
    
    // set the svg root group
    this._ctx = svg.append("g")
      .attr("transform", "translate("+pad.left+","+pad.top+")");
    
    return this;
  };
  
  prototype.context = function() {
    return this._ctx;
  };
  
  prototype.element = function() {
    return this._el;
  };
  
  prototype.render = function(scene, items) {
    if (items) this.renderItems(vg.array(items));
    else this.draw(this._ctx, scene, 0);
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
vg.canvas.Renderer = (function() {  
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
    
    if (!el) return this; // early exit if no DOM element

    // select canvas element
    var canvas = d3.select(el)
      .selectAll("canvas.marks")
      .data([1]);
    
    // create new canvas element if needed
    canvas.enter()
      .append("canvas")
      .attr("class", "marks");
    
    // initialize canvas attributes
    canvas
      .attr("width", width + pad.left + pad.right)
      .attr("height", height + pad.top + pad.bottom);
    
    // get the canvas graphics context
    this._ctx = canvas.node().getContext("2d");
    this._ctx.setTransform(1, 0, 0, 1, pad.left, pad.top);
    
    return this;
  };
  
  prototype.context = function(ctx) {
    if (ctx) { this._ctx = ctx; return this; }
    else return this._ctx;
  };
  
  prototype.element = function() {
    return this._el;
  };

  function translatedBounds(item) {
    var b = new vg.Bounds(item.bounds);
    while ((item = item.mark.group) != null) {
      b.translate(item.x || 0, item.y || 0);
    }
    return b;
  }
    
  function getBounds(items) {
    return !items ? null :
      vg.array(items).reduce(function(b, item) {
        return b.union(translatedBounds(item));
      }, new vg.Bounds());  
  }
  
  function setBounds(g, bounds) {
    var bbox = null;
    if (bounds) {
      bbox = (new vg.Bounds(bounds)).round();
      g.beginPath();
      g.rect(bbox.x1, bbox.y1, bbox.width(), bbox.height());
      g.clip();
    }
    return bbox;
  }
  
  prototype.render = function(scene, items) {
    var g = this._ctx,
        pad = this._padding,
        w = this._width + pad.left + pad.right,
        h = this._width + pad.top + pad.bottom,
        bb = null;

    // setup
    this._scene = scene;
    g.save();
    bb = setBounds(g, getBounds(items));
    g.clearRect(-pad.left, -pad.top, w, h);
    
    // render
    this.draw(g, scene, bb);

    // render again to handle possible bounds change
    if (items) {
      g.restore();
      g.save();
      bb = setBounds(g, getBounds(items));
      g.clearRect(-pad.left, -pad.top, w, h);
      this.draw(g, scene, bb);
    }
    
    // takedown
    g.restore();
    this._scene = null;
  };
  
  prototype.draw = function(ctx, scene, bounds) {
    var marktype = scene.marktype,
        renderer = vg.canvas.marks.draw[marktype];
    renderer.call(this, ctx, scene, bounds);
  };
  
  prototype.renderAsync = function(scene) {
    // TODO make safe for multiple scene rendering?
    var renderer = this;
    if (renderer._async_id) {
      clearTimeout(renderer._async_id);
    }
    renderer._async_id = setTimeout(function() {
      renderer.render(scene);
      delete renderer._async_id;
    }, 50);
  };
  
  prototype.loadImage = function(uri) {
    var renderer = this,
        scene = this._scene;
    
    var image = new Image();
    image.onload = function() {
      vg.log("LOAD IMAGE: "+this.src);
      renderer.renderAsync(scene);
    };
    image.src = uri;
    return image;
  };
  
  return renderer;
})();
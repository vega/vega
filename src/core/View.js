vg.View = (function() {
  var view = function(el, width, height) {
    this._el = null;
    this._build = false;
    this._model = new vg.Model();
    this._width = width || 500;
    this._height = height || 500;
    this._padding = {top:0, left:0, bottom:0, right:0};
    this._viewport = null;
    if (el) this.initialize(el);
  };
  
  var prototype = view.prototype;
  
  prototype.width = function(width) {
    if (!arguments.length) return this._width;
    if (this._width !== width) {
      this._width = width;
      if (this._el) this.initialize(this._el);
    }
    return this;
  };

  prototype.height = function(height) {
    if (!arguments.length) return this._height;
    if (this._height !== height) {
      this._height = height;
      if (this._el) this.initialize(this._el);
    }
    return this;
  };

  prototype.padding = function(pad) {
    if (!arguments.length) return this._padding;
    if (this._padding !== pad) {
      this._padding = pad;
      if (this._el) this.initialize(this._el);
    }
    return this;
  };

  prototype.viewport = function(size) {
    if (!arguments.length) return this._viewport;
    if (this._viewport !== size) {
      this._viewport = size;
      if (this._el) this.initialize(this._el);
    }
    return this;
  };

  prototype.defs = function(defs) {
    if (!arguments.length) return this._model.defs();
    this._model.defs(defs);
    return this;
  };

  prototype.data = function(data) {
    if (!arguments.length) return this._model.data();
    var ingest = vg.keys(data).reduce(function(d, k) {
      return (d[k] = data[k].map(vg.data.ingest), d);
    }, {});
    this._model.data(ingest);
    return this;
  };

  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    if (this._model !== model) {
      this._model = model;
      if (this._handler) this._handler.model(model);
    }
    return this;
  };

  prototype.initialize = function(el) {
    // div container
    this._el = d3.select(el)
      .style("position", "relative")
      .node();
    if (this._viewport) {
      var vw = this._viewport[0] || this._width,
          vh = this._viewport[1] || this._height;
      d3.select(el)
        .style("width", vw+"px")
        .style("height", vh+"px")
        .style("overflow", "auto");
    }
    
    // axis container
    this._axes = (this._axes || new vg.Axes)
      .initialize(this._el, this._width, this._height, this._padding);
    
    // renderer
    this._renderer = (this._renderer || new vg.canvas.Renderer())
      .initialize(this._el, this._width, this._height, this._padding);
    
    // input handler
    if (!this._handler) {
      this._handler = new vg.canvas.Handler()
        .initialize(this._el, this._padding, this)
        .model(this._model);
    }
    
    return this;
  };
  
  prototype.render = function(bounds) {
    var m = this._model;
    this._axes.update(m._axes, m._scales);
    this._renderer.render(m.scene(), bounds);
    return this;
  };
  
  prototype.on = function() {
    this._handler.on.apply(this._handler, arguments);
    return this;
  };
  
  prototype.off = function() {
    this._handler.off.apply(this._handler, arguments);
    return this;
  };
  
  prototype.update = function(request, items) {
    this._build = this._build || (this._model.build(), true);
    this._model.encode(request, items);
    
    function bounds() {
      return !items ? null :
        vg.array(items).reduce(function(b, x) {
          return b.union(x.item.bounds);
        }, new vg.Bounds());  
    }
    
    this.render(bounds());
    return items ? this.render(bounds()) : this;
  };
  
  return view;
})();

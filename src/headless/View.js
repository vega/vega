vg.headless.View = (function() {
  
  var view = function(width, height, pad, type) {
    this._canvas = null;
    this._type = type;
    this._el = "body";
    this._build = false;
    this._model = new vg.Model();
    this._width = this.__width = width || 500;
    this._height = this.__height = height || 500;
    this._autopad = 1;
    this._padding = pad || {top:0, left:0, bottom:0, right:0};
    this._renderer = new vg[type].Renderer();
    this.initialize();
  };
  
  var prototype = view.prototype;

  prototype.el = function(el) {
    if (!arguments.length) return this._el;
    if (this._el !== el) {
      this._el = el;
      this.initialize();
    }
    return this;
  };

  prototype.width = function(width) {
    if (!arguments.length) return this._width;
    if (this._width !== width) {
      this._width = width;
      this.initialize();
      this._model.width(width);
    }
    return this;
  };

  prototype.height = function(height) {
    if (!arguments.length) return this._height;
    if (this._height !== height) {
      this._height = height;
      this.initialize();
      this._model.height(this._height);
    }
    return this;
  };

  prototype.padding = function(pad) {
    if (!arguments.length) return this._padding;
    if (this._padding !== pad) {
      if (vg.isString(pad)) {
        this._autopad = 1;
        this._padding = {top:0, left:0, bottom:0, right:0};
        this._strict = (pad === "strict");
      } else {
        this._autopad = 0;
        this._padding = pad;
        this._strict = false;
      }
      this.initialize();
    }
    return this;
  };

  prototype.autopad = function(opt) {
    if (this._autopad < 1) return this;
    else this._autopad = 0;

    var pad = this._padding,
        b = this._model.scene().bounds,
        inset = vg.config.autopadInset,
        l = b.x1 < 0 ? Math.ceil(-b.x1) + inset : 0,
        t = b.y1 < 0 ? Math.ceil(-b.y1) + inset : 0,
        r = b.x2 > this._width  ? Math.ceil(+b.x2 - this._width) + inset : 0,
        b = b.y2 > this._height ? Math.ceil(+b.y2 - this._height) + inset : 0;
    pad = {left:l, top:t, right:r, bottom:b};

    if (this._strict) {
      this._autopad = 0;
      this._padding = pad;
      this._width = Math.max(0, this.__width - (l+r));
      this._height = Math.max(0, this.__height - (t+b));
      this._model.width(this._width);
      this._model.height(this._height);
      if (this._el) this.initialize();
      this.update({props:"enter"}).update({props:"update"});
    } else {
      this.padding(pad).update(opt);
    }
    return this;
  };

  prototype.viewport = function() {
    if (!arguments.length) return null;
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
      return (d[k] = vg.data.ingestAll(data[k]), d);
    }, {});
    this._model.data(ingest);
    this._build = false;
    return this;
  };

  prototype.renderer = function() {
    return this._renderer;
  };

  prototype.canvas = function() {
    return this._canvas;
  };
  
  prototype.canvasAsync = function(callback) {
    var r = this._renderer, view = this;
    
    function wait() {
      if (r.pendingImages() === 0) {
        view.render(); // re-render with all images
        callback(view._canvas);
      } else {
        setTimeout(wait, 10);
      }
    }

    // if images loading, poll until ready
    (r.pendingImages() > 0) ? wait() : callback(this._canvas);
  };
  
  prototype.svg = function() {
    if (this._type !== "svg") return null;

    var p = this._padding,
        w = this._width  + (p ? p.left + p.right : 0),
        h = this._height + (p ? p.top + p.bottom : 0);

      // build svg text
    var svg = d3.select(this._el)
      .select("svg").node().innerHTML
      .replace(/ href=/g, " xlink:href="); // ns hack. sigh.

    return '<svg '
      + 'width="' + w + '" '
      + 'height="' + h + '" '
      + vg.config.svgNamespace + '>' + svg + '</svg>'
  };

  prototype.initialize = function() {    
    var w = this._width,
        h = this._height,
        pad = this._padding;
    
    if (this._type === "svg") {
      this.initSVG(w, h, pad);
    } else {
      this.initCanvas(w, h, pad);
    }
    
    return this;
  };
  
  prototype.initCanvas = function(w, h, pad) {
    var Canvas = require("canvas"),
        tw = w + pad.left + pad.right,
        th = h + pad.top + pad.bottom,
        canvas = this._canvas = new Canvas(tw, th),
        ctx = canvas.getContext("2d");
    
    // setup canvas context
    ctx.setTransform(1, 0, 0, 1, pad.left, pad.top);

    // configure renderer
    this._renderer.context(ctx);
    this._renderer.resize(w, h, pad);
  };
  
  prototype.initSVG = function(w, h, pad) {
    var tw = w + pad.left + pad.right,
        th = h + pad.top + pad.bottom;

    // configure renderer
    this._renderer.initialize(this._el, w, h, pad);
  }
  
  prototype.render = function(items) {
    this._renderer.render(this._model.scene(), items);
    return this;
  };
  
  prototype.update = function(opt) {
    opt = opt || {};
    var view = this;
    view._build = view._build || (view._model.build(), true);
    view._model.encode(null, opt.props, opt.items);
    view.render(opt.items);
    return view.autopad(opt);
  };
    
  return view;
})();

// headless view constructor factory
// takes definitions from parsed specification as input
// returns a view constructor
vg.headless.View.Factory = function(defs) {
  return function(opt) {
    opt = opt || {};
    var w = defs.width,
        h = defs.height,
        p = defs.padding,
        r = opt.renderer || "canvas",
        v = new vg.headless.View(w, h, p, r).defs(defs);
    if (defs.data.load) v.data(defs.data.load);
    if (opt.data) v.data(opt.data);
    return v;
  };
};
define(function(require, exports, module) {
  var d3 = require('d3'),
      parseStreams = require('../parse/streams'),
      canvas = require('../render/canvas/index'),
      svg = require('../render/svg/index'),
      transition = require('../scene/transition'),
      config = require('../util/config'),
      util = require('../util/index'),
      changeset = require('../dataflow/changeset');

  var View = function(el, width, height, model) {
    this._el    = null;
    this._model = null;
    this._width = this.__width = width || 500;
    this._height = this.__height = height || 300;
    this._autopad = 1;
    this._padding = {top:0, left:0, bottom:0, right:0};
    this._viewport = null;
    this._renderer = null;
    this._handler = null;
    this._io = canvas;
    if (el) this.initialize(el);
  };

  var prototype = View.prototype;

  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    if (this._model !== model) {
      this._model = model;
      if (this._handler) this._handler.model(model);
    }
    return this;
  };

  prototype.data = function(data) {
    var m = this.model();
    if (!arguments.length) return m.data();
    util.keys(data).forEach(function(d) { m.data(d).add(data[d]); });
    return this;
  };

  prototype.width = function(width) {
    if (!arguments.length) return this.__width;
    if (this.__width !== width) {
      this._width = this.__width = width;
      if (this._el) this.initialize(this._el.parentNode);
      if (this._strict) this._autopad = 1;
    }
    return this;
  };

  prototype.height = function(height) {
    if (!arguments.length) return this.__height;
    if (this.__height !== height) {
      this._height = this.__height = height;
      if (this._el) this.initialize(this._el.parentNode);
      if (this._strict) this._autopad = 1;
    }
    return this;
  };

  prototype.padding = function(pad) {
    if (!arguments.length) return this._padding;
    if (this._padding !== pad) {
      if (util.isString(pad)) {
        this._autopad = 1;
        this._padding = {top:0, left:0, bottom:0, right:0};
        this._strict = (pad === "strict");
      } else {
        this._autopad = 0;
        this._padding = pad;
        this._strict = false;
      }
      if (this._el) {
        this._renderer.resize(this._width, this._height, pad);
        this._handler.padding(pad);
      }
    }
    return this;
  };
  
  prototype.autopad = function(opt) {
    if (this._autopad < 1) return this;
    else this._autopad = 0;

    var pad = this._padding,
        b = this.model().scene().bounds,
        inset = config.autopadInset,
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
      if (this._el) this.initialize(this._el.parentNode);
      this.update({props:"enter"}).update({props:"update"});
    } else {
      this.padding(pad).update(opt);
    }
    return this;
  };

  prototype.viewport = function(size) {
    if (!arguments.length) return this._viewport;
    if (this._viewport !== size) {
      this._viewport = size;
      if (this._el) this.initialize(this._el.parentNode);
    }
    return this;
  };

  prototype.renderer = function(type) {
    if (!arguments.length) return this._io;
    if (type === "canvas") type = canvas;
    if (type === "svg") type = svg;
    if (this._io !== type) {
      this._io = type;
      this._renderer = null;
      if (this._el) this.initialize(this._el.parentNode);
      if (this._build) this.render();
    }
    return this;
  };
  
  prototype.initialize = function(el) {
    var v = this, prevHandler,
        w = v._width, h = v._height, pad = v._padding;
    
    // clear pre-existing container
    d3.select(el).select("div.vega").remove();
    
    // add div container
    this._el = el = d3.select(el)
      .append("div")
      .attr("class", "vega")
      .style("position", "relative")
      .node();
    if (v._viewport) {
      d3.select(el)
        .style("width",  (v._viewport[0] || w)+"px")
        .style("height", (v._viewport[1] || h)+"px")
        .style("overflow", "auto");
    }
    
    // renderer
    v._renderer = (v._renderer || new this._io.Renderer())
      .initialize(el, w, h, pad);
    
    // input handler
    prevHandler = v._handler;
    v._handler = new this._io.Handler()
      .initialize(el, pad, v)
      .model(v._model);

    if (prevHandler) {
      prevHandler.handlers().forEach(function(h) {
        v._handler.on(h.type, h.handler);
      });
    } else {
      // Register event listeners for signal stream definitions.
      parseStreams(this);
    }
    
    return this;
  };

  prototype.update = function(opt) {    
    opt = opt || {};
    var v = this,
        trans = opt.duration
          ? new transition(opt.duration, opt.ease)
          : null;

    var cs = changeset.create({});
    if(trans) cs.trans = trans;

    if(!v._build) {
      v._renderNode = new v._model.Node(function(input) {
        util.debug(input, ["rendering"]);

        var s = v._model.scene();
        if(input.trans) {
          input.trans.start(function(items) { v._renderer.render(s, items); });
        } else {
          v._renderer.render(s);
        }
        return input;
      });
      v._renderNode._router = true;

      v._model.scene(v._renderNode);
      v._build = true;
    }

    // Pulse the entire model (Datasources + scene).
    v._model.fire(cs);

    return v.autopad(opt);
  };

  prototype.on = function() {
    this._handler.on.apply(this._handler, arguments);
    return this;
  };
  
  prototype.off = function() {
    this._handler.off.apply(this._handler, arguments);
    return this;
  };

  View.factory = function(model) {
    return function(opt) {
      opt = opt || {};
      var defs = model.defs();
      var v = new View()
        .model(model)
        .width(defs.width)
        .height(defs.height)
        .padding(defs.padding)
        .renderer(opt.renderer || "canvas");

      if (opt.el) v.initialize(opt.el);
      if (opt.data) v.data(opt.data);
    
      return v;
    };    
  };

  return View;
})
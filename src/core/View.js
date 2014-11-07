define(function(require, exports, module) {
  var vg = require('vega'), 
      d3 = require('d3'),
      parseStreams = require('../parse/streams'),
      canvas = require('../canvas/index');

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

  prototype.renderer = function(type) {
    if (!arguments.length) return this._io;
    if (type === "canvas") type = canvas;
    if (type === "svg") type = vg.svg;
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
          ? vg.scene.transition(opt.duration, opt.ease)
          : null;

    if(v._build) {
      // TODO: only fire branches of the dataflow corresponding to opt.items
    } else {
      // Build the entire scene, and pulse the entire model
      // (Datasources + scene).
      v._renderNode = new v._model.Node(function(input) {
        global.debug(input, ["rendering"]);

        if(input.add.length) v._renderer.render(v._model.scene());
        if(input.mod.length) v._renderer.render(v._model.scene());
        return input;
      });
      v._renderNode._router = true;
      v._renderNode._type = 'renderer';

      v._model.scene(v._renderNode).fire();
      v._build = true;
    }

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

  View.factory = function(model) {
    return function(opt) {
      opt = opt || {};
      var v = new View()
        .model(model)
        .renderer(opt.renderer || "canvas");

      if (opt.el) v.initialize(opt.el);
    
      return v;
    };    
  };

  return View;
})
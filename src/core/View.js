var d3 = require('d3'),
    dl = require('datalib'),
    df = require('vega-dataflow'),
    sg = require('vega-scenegraph').render,
    log = require('vega-logging'),
    parseStreams = require('../parse/streams'),
    Encoder = require('../scene/Encoder'),
    Transition = require('../scene/Transition');

function View(el, width, height) {
  this._el    = null;
  this._model = null;
  this._width = this.__width = width || 500;
  this._height  = this.__height = height || 300;
  this._bgcolor = null;
  this._autopad = 1;
  this._padding = {top:0, left:0, bottom:0, right:0};
  this._viewport = null;
  this._renderer = null;
  this._handler  = null;
  this._streamer = null; // Targeted update for streaming changes
  this._changeset = null;
  this._repaint = true; // Full re-render on every re-init
  this._renderers = sg;
  this._io  = null;
  this._api = {}; // Stash streaming data API sandboxes.
}

var prototype = View.prototype;

prototype.model = function(model) {
  if (!arguments.length) return this._model;
  if (this._model !== model) {
    this._model = model;
    this._streamer = new df.Node(model);
    this._changeset = df.ChangeSet.create();
    if (this._handler) this._handler.model(model);
  }
  return this;
};

// Sandboxed streaming data API
function streaming(src) {
  var view = this,
      ds = this._model.data(src),
      name = ds.name(),
      listener = ds.pipeline()[0],
      streamer = this._streamer,
      api = {};

  // If we have it stashed, don't create a new closure. 
  if (this._api[src]) return this._api[src];

  api.insert = function(vals) {
    ds.insert(dl.duplicate(vals));  // Don't pollute the environment
    streamer.addListener(listener);
    view._changeset.data[name] = 1;
    return api;
  };

  api.update = function() {
    streamer.addListener(listener);
    view._changeset.data[name] = 1;
    return (ds.update.apply(ds, arguments), api);
  };

  api.remove = function() {
    streamer.addListener(listener);
    view._changeset.data[name] = 1;
    return (ds.remove.apply(ds, arguments), api);
  };

  api.values = function() { return ds.values(); };    

  return (this._api[src] = api);
}

prototype.data = function(data) {
  var v = this;
  if (!arguments.length) return v._model.dataValues();
  else if (dl.isString(data)) return streaming.call(v, data);
  else if (dl.isObject(data)) {
    dl.keys(data).forEach(function(k) {
      var api = streaming.call(v, k);
      data[k](api);
    });
  }
  return this;
};

prototype.signal = function(name, value) {
  var m  = this._model,
      cs = this._changeset,
      streamer = this._streamer,
      setter = name; 

  if (!arguments.length) return m.signalValues();
  else if (arguments.length == 1 && dl.isString(name)) return m.signalValues(name);

  if (arguments.length == 2) {
    setter = {};
    setter[name] = value;
  }

  dl.keys(setter).forEach(function(k) {
    streamer.addListener(m.signal(k).value(setter[k]));
    cs.signals[k] = 1;
    cs.reflow = true;
  });

  return this;
};

prototype.width = function(width) {
  if (!arguments.length) return this.__width;
  if (this.__width !== width) {
    this._width = this.__width = width;
    this.model().width(width);
    this.initialize();
    if (this._strict) this._autopad = 1;
  }
  return this;
};

prototype.height = function(height) {
  if (!arguments.length) return this.__height;
  if (this.__height !== height) {
    this._height = this.__height = height;
    this.model().height(height);
    this.initialize();
    if (this._strict) this._autopad = 1;
  }
  return this;
};

prototype.background = function(bgcolor) {
  if (!arguments.length) return this._bgcolor;
  if (this._bgcolor !== bgcolor) {
    this._bgcolor = bgcolor;
    this.initialize();
  }
  return this;
};

prototype.padding = function(pad) {
  if (!arguments.length) return this._padding;
  if (this._padding !== pad) {
    if (dl.isString(pad)) {
      this._autopad = 1;
      this._padding = {top:0, left:0, bottom:0, right:0};
      this._strict = (pad === 'strict');
    } else {
      this._autopad = 0;
      this._padding = pad;
      this._strict = false;
    }
    if (this._renderer) this._renderer.resize(this._width, this._height, pad);
    if (this._handler)  this._handler.padding(pad);
  }
  return (this._repaint = true, this);
};

prototype.autopad = function(opt) {
  if (this._autopad < 1) return this;
  else this._autopad = 0;

  var b = this.model().scene().bounds,
      pad = this._padding,
      config = this.model().config(),
      inset = config.autopadInset,
      l = b.x1 < 0 ? Math.ceil(-b.x1) + inset : 0,
      t = b.y1 < 0 ? Math.ceil(-b.y1) + inset : 0,
      r = b.x2 > this._width  ? Math.ceil(+b.x2 - this._width) + inset : 0;
  b = b.y2 > this._height ? Math.ceil(+b.y2 - this._height) + inset : 0;
  pad = {left:l, top:t, right:r, bottom:b};

  if (this._strict) {
    this._autopad = 0;
    this._padding = pad;
    this._width = Math.max(0, this.__width - (l+r));
    this._height = Math.max(0, this.__height - (t+b));

    this._model.width(this._width)
      .height(this._height).reset();

    this.initialize()
      .update({props:'enter'}).update({props:'update'});
  } else {
    this.padding(pad).update(opt);
  }
  return this;
};

prototype.viewport = function(size) {
  if (!arguments.length) return this._viewport;
  if (this._viewport !== size) {
    this._viewport = size;
    this.initialize();
  }
  return this;
};

prototype.renderer = function(type) {
  if (!arguments.length) return this._renderer;
  if (this._renderers[type]) type = this._renderers[type];
  else if (dl.isString(type)) throw new Error('Unknown renderer: ' + type);
  else if (!type) throw new Error('No renderer specified');

  if (this._io !== type) {
    this._io = type;
    this._renderer = null;
    this.initialize();
    if (this._build) this.render();
  }
  return this;
};

prototype.initialize = function(el) {
  var v = this, prevHandler,
      w = v._width, h = v._height, pad = v._padding, bg = v._bgcolor,
      config = this.model().config();

  if (!arguments.length || el === null) {
    el = this._el ? this._el.parentNode : null;
    if (!el) return this;  // This View cannot init w/o an
  }

  // clear pre-existing container
  d3.select(el).select('div.vega').remove();
  
  // add div container
  this._el = el = d3.select(el)
    .append('div')
    .attr('class', 'vega')
    .style('position', 'relative')
    .node();
  if (v._viewport) {
    d3.select(el)
      .style('width',  (v._viewport[0] || w)+'px')
      .style('height', (v._viewport[1] || h)+'px')
      .style('overflow', 'auto');
  }

  // renderer
  sg.canvas.Renderer.RETINA = config.render.retina;
  v._renderer = (v._renderer || new this._io.Renderer(config.load))
    .initialize(el, w, h, pad)
    .background(bg);
  
  // input handler
  prevHandler = v._handler;
  v._handler = new this._io.Handler()
    .initialize(el, pad, v);

  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      v._handler.on(h.type, h.handler);
    });
  } else {
    // Register event listeners for signal stream definitions.
    v._detach = parseStreams(this);
  }
  
  return (this._repaint = true, this);
};

prototype.destroy = function() {
  if (this._detach) this._detach();
};

function build() {
  var v = this;
  v._renderNode = new df.Node(v._model)
    .router(true);

  v._renderNode.evaluate = function(input) {
    log.debug(input, ['rendering']);

    var s = v._model.scene(),
        h = v._handler,
        d;

    if (h && h.scene) h.scene(s);

    if (input.trans) {
      input.trans.start(function(items) { v._renderer.render(s, items); });
    } else if (v._repaint) {
      v._renderer.render(s);
      v._repaint = false;
    } else if (input.dirty.length) {
      v._renderer.render(s, input.dirty);
    }

    if (input.dirty.length) {
      input.dirty.forEach(function(i) { i._dirty = false; });
      s.items[0]._dirty = false;
    }

    // For all updated datasources, clear their previous values.
    for (d in input.data) v._model.data(d).finalize();
    return input;
  };

  return (v._model.scene(v._renderNode), true);  
}

prototype.update = function(opt) {   
  opt = opt || {};
  var v = this,
      trans = opt.duration ? new Transition(opt.duration, opt.ease) : null;

  var cs = v._changeset;
  if (trans) cs.trans = trans;
  if (opt.props !== undefined) {
    if (dl.keys(cs.data).length > 0) {
      throw Error(
        'New data values are not reflected in the visualization.' +
        ' Please call view.update() before updating a specified property set.'
      );
    }

    cs.reflow  = true;
    cs.request = opt.props;
  }

  var built = v._build;
  v._build = v._build || build.call(this);

  // If specific items are specified, short-circuit dataflow graph.
  // Else-If there are streaming updates, perform a targeted propagation.
  // Otherwise, reevaluate the entire model (datasources + scene).
  if (opt.items && built) { 
    Encoder.update(this._model, opt.trans, opt.props, opt.items, cs.dirty);
    v._renderNode.evaluate(cs);
  } else if (v._streamer.listeners().length && built) {
    v._model.propagate(cs, v._streamer);
    v._streamer.disconnect();
  } else {
    v._model.fire(cs);
  }

  v._changeset = df.ChangeSet.create();

  return v.autopad(opt);
};

prototype.render = function(items) {
  this._renderer.render(this._model.scene(), items);
  return this;
};

prototype.on = function() {
  this._handler.on.apply(this._handler, arguments);
  return this;
};

prototype.onSignal = function(name, handler) {
  this._model.signal(name).on(handler);
  return this;
};

prototype.off = function() {
  this._handler.off.apply(this._handler, arguments);
  return this;
};

prototype.offSignal = function(name, handler) {
  this._model.signal(name).off(handler);
  return this;
};

View.factory = function(model) {
  var HeadlessView = require('./HeadlessView');
  return function(opt) {
    opt = opt || {};
    var defs = model.defs();
    var v = (opt.el ? new View() : new HeadlessView())
      .model(model)
      .renderer(opt.renderer || 'canvas')
      .width(defs.width)
      .height(defs.height)
      .background(defs.background)
      .padding(defs.padding)
      .viewport(defs.viewport)
      .initialize(opt.el);

    if (opt.data) v.data(opt.data);

    if (opt.hover !== false && opt.el) {
      v.on('mouseover', function(evt, item) {
        if (item && item.hasPropertySet('hover')) {
          this.update({props:'hover', items:item});
        }
      })
      .on('mouseout', function(evt, item) {
        if (item && item.hasPropertySet('hover')) {
          this.update({props:'update', items:item});
        }
      });
    }
  
    return v;
  };    
};

module.exports = View;

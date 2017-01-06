var d3 = require('d3'),
    dl = require('datalib'),
    df = require('vega-dataflow'),
        scene = require('vega-scenegraph'),
    sg = scene.render,
    bound = scene.bound,
    log = require('vega-logging'),
    Deps = df.Dependencies,
    parseStreams = require('../parse/streams'),
    Encoder = require('../scene/Encoder'),
    Transition = require('../scene/Transition');

function View(el, width, height) {
  this._el    = null;
  this._model = null;
  this._width   = this.__width = width || 500;
  this._height  = this.__height = height || 300;
  this._bgcolor = null;
  this._cursor  = true; // Set cursor based on hover propset?
  this._autopad = 1;
  this._padding = {top:0, left:0, bottom:0, right:0};
  this._viewport = null;
  this._renderer = null;
  this._handler  = null;
  this._streamer = null; // Targeted update for streaming changes
  this._skipSignals = false; // Batch set signals can skip reevaluation.
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
    this._streamer._rank = -1;  // HACK: To reduce re-ranking churn.
    this._changeset = df.ChangeSet.create();
    if (this._handler) this._handler.model(model);
  }
  return this;
};

// Sandboxed streaming data API
function streaming(src) {
  var view = this,
      ds = this._model.data(src);
  if (!ds) return log.error('Data source "'+src+'" is not defined.');

  var listener = ds.pipeline()[0],
      streamer = this._streamer,
      api = {};

  // If we have it stashed, don't create a new closure.
  if (this._api[src]) return this._api[src];

  api.insert = function(vals) {
    ds.insert(dl.duplicate(vals));  // Don't pollute the environment
    streamer.addListener(listener);
    view._changeset.data[src] = 1;
    return api;
  };

  api.update = function() {
    streamer.addListener(listener);
    view._changeset.data[src] = 1;
    return (ds.update.apply(ds, arguments), api);
  };

  api.remove = function() {
    streamer.addListener(listener);
    view._changeset.data[src] = 1;
    return (ds.remove.apply(ds, arguments), api);
  };

  api.values = function() { return ds.values(); };

  return (this._api[src] = api);
}

prototype.data = function(data) {
  var v = this;
  if (!arguments.length) return v._model.values();
  else if (dl.isString(data)) return streaming.call(v, data);
  else if (dl.isObject(data)) {
    dl.keys(data).forEach(function(k) {
      var api = streaming.call(v, k);
      data[k](api);
    });
  }
  return this;
};

var VIEW_SIGNALS = dl.toMap(['width', 'height', 'padding']);

prototype.signal = function(name, value, skip) {
  var m = this._model,
      key, values;

  // Getter. Returns the value for the specified signal, or
  // returns all signal values.
  if (!arguments.length) {
    return m.values(Deps.SIGNALS);
  } else if (arguments.length === 1 && dl.isString(name)) {
    return m.values(Deps.SIGNALS, name);
  }

  // Setter. Can be done in batch or individually. In either case,
  // the final argument determines if set signals should be skipped.
  if (dl.isObject(name)) {
    values = name;
    skip = value;
  } else {
    values = {};
    values[name] = value;
  }
  for (key in values) {
    if (VIEW_SIGNALS[key]) {
      this[key](values[key]);
    } else {
      setSignal.call(this, key, values[key]);
    }
  }
  return (this._skipSignals = skip, this);
};

function setSignal(name, value) {
  var cs = this._changeset,
      sg = this._model.signal(name);
  if (!sg) return log.error('Signal "'+name+'" is not defined.');

  this._streamer.addListener(sg.value(value));
  cs.signals[name] = 1;
  cs.reflow = true;
}

prototype.width = function(width) {
  if (!arguments.length) return this.__width;
  if (this.__width !== width) {
    this._width = this.__width = width;
    this.model().width(width);
    this.initialize();
    if (this._strict) this._autopad = 1;
    setSignal.call(this, 'width', width);
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
    setSignal.call(this, 'height', height);
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
    if (this._renderer) this._renderer.resize(this._width, this._height, this._padding);
    if (this._handler)  this._handler.padding(this._padding);
    setSignal.call(this, 'padding', this._padding);
  }
  return (this._repaint = true, this);
};

function viewBounds() {
  var s = this.model().scene(),
      legends = s.items[0].legendItems,
      i = 0, len = legends.length,
      b, lb;

  // For strict padding, clip legend height to prevent a tiny data rectangle.
  if (this._strict) {
    b = bound.mark(s, null, false);
    for (; i<len; ++i) {
      lb = legends[i].bounds;
      b.add(lb.x1, 0).add(lb.x2, 0);
    }
    return b;
  }

  return s.bounds;
}

prototype.autopad = function(opt) {
  if (this._autopad < 1) return this;
  else this._autopad = 0;

  var b = viewBounds.call(this),
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

    this._model.width(this._width).height(this._height).reset();
    setSignal.call(this, 'width', this._width);
    setSignal.call(this, 'height', this._height);
    setSignal.call(this, 'padding', pad);

    this.initialize().update({props:'enter'}).update({props:'update'});
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
        h = v._handler;

    if (h && h.scene) h.scene(s);

    if (input.trans) {
      input.trans.start(function(items) { v._renderer.render(s, items); });
    } else if (v._repaint) {
      v._renderer.render(s);
    } else if (input.dirty.length) {
      v._renderer.render(s, input.dirty);
    }

    if (input.dirty.length) {
      input.dirty.forEach(function(i) { i._dirty = false; });
      s.items[0]._dirty = false;
    }

    v._repaint = v._skipSignals = false;
    return input;
  };

  return (v._model.scene(v._renderNode), true);
}

prototype.update = function(opt) {
  opt = opt || {};
  var v = this,
      model = this._model,
      streamer = this._streamer,
      cs = this._changeset,
      trans = opt.duration ? new Transition(opt.duration, opt.ease) : null;

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
  // Otherwise, re-evaluate the entire model (datasources + scene).
  if (opt.items && built) {
    Encoder.update(model, opt.trans, opt.props, opt.items, cs.dirty);
    v._renderNode.evaluate(cs);
  } else if (streamer.listeners().length && built) {
    // Include re-evaluation entire model when repaint flag is set
    if (this._repaint) streamer.addListener(model.node());
    model.propagate(cs, streamer, null, this._skipSignals);
    streamer.disconnect();
  } else {
    model.fire(cs);
  }

  v._changeset = df.ChangeSet.create();

  return v.autopad(opt);
};

prototype.toImageURL = function(type) {
  var v = this, Renderer;

  // lookup appropriate renderer
  switch (type || 'png') {
    case 'canvas':
    case 'png':
      Renderer = sg.canvas.Renderer; break;
    case 'svg':
      Renderer = sg.svg.string.Renderer; break;
    default: throw Error('Unrecognized renderer type: ' + type);
  }

  var retina = sg.canvas.Renderer.RETINA;
  sg.canvas.Renderer.RETINA = false; // ignore retina screen

  // render the scenegraph
  var ren = new Renderer(v._model.config.load)
    .initialize(null, v._width, v._height, v._padding)
    .background(v._bgcolor)
    .render(v._model.scene());

  sg.canvas.Renderer.RETINA = retina; // restore retina settings

  // return data url
  if (type === 'svg') {
    var blob = new Blob([ren.svg()], {type: 'image/svg+xml'});
    return window.URL.createObjectURL(blob);
  } else {
    return ren.canvas().toDataURL('image/png');
  }
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
  var sg = this._model.signal(name);
  return (sg ?
    sg.on(handler) : log.error('Signal "'+name+'" is not defined.'), this);
};

prototype.off = function() {
  this._handler.off.apply(this._handler, arguments);
  return this;
};

prototype.offSignal = function(name, handler) {
  var sg = this._model.signal(name);
  return (sg ?
    sg.off(handler) : log.error('Signal "'+name+'" is not defined.'), this);
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

    // Register handlers for the hover propset and cursors.
    if (opt.el) {
      if (opt.hover !== false) {
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

      if (opt.cursor !== false) {
        // If value is a string, it is a custom value set by the user.
        // In this case, the user is responsible for maintaining the cursor state
        // and control only reverts back to this handler if set back to 'default'.
        v.onSignal('cursor', function(name, value) {
          var body = d3.select('body');
          if (dl.isString(value)) {
            v._cursor = value === 'default';
            body.style('cursor', value);
          } else if (dl.isObject(value) && v._cursor) {
            body.style('cursor', value.default);
          }
        });
      }
    }

    return v;
  };
};

module.exports = View;

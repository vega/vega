import cursor from './cursor';
import {data, change, insert, remove} from './data';
import {initializeEventConfig, events} from './events';
import hover from './hover';
import finalize from './finalize';
import initialize from './initialize';
import renderToImageURL from './render-to-image-url';
import renderToCanvas from './render-to-canvas';
import renderToSVG from './render-to-svg';
import {resizeRenderer} from './render-size';
import runtime from './runtime';
import {resizeView, initializeResize, viewWidth, viewHeight} from './size';
import {getState, setState} from './state';

import {Dataflow} from 'vega-dataflow';
import {error, extend, inherits, stringValue} from 'vega-util';
import {
  Handler, CanvasHandler, Scenegraph,
  renderModule, RenderType
} from 'vega-scenegraph';

/**
 * Create a new View instance from a Vega dataflow runtime specification.
 * The generated View will not immediately be ready for display. Callers
 * should also invoke the initialize method (e.g., to set the parent
 * DOM element in browser-based deployment) and then invoke the run
 * method to evaluate the dataflow graph. Rendering will automatically
 * be peformed upon dataflow runs.
 * @constructor
 * @param {object} spec - The Vega dataflow runtime specification.
 */
export default function View(spec, options) {
  var view = this;
  options = options || {};

  Dataflow.call(view);
  view.loader(options.loader || view._loader);
  view.logLevel(options.logLevel || 0);

  view._el = null;
  view._renderType = options.renderer || RenderType.Canvas;
  view._scenegraph = new Scenegraph();
  var root = view._scenegraph.root;

  // initialize renderer, handler and event management
  view._renderer = null;
  view._redraw = true;
  view._handler = new CanvasHandler().scene(root);
  view._preventDefault = false;
  view._eventListeners = [];
  view._resizeListeners = [];

  // initialize dataflow graph
  var ctx = runtime(view, spec, options.functions);
  view._runtime = ctx;
  view._signals = ctx.signals;
  view._bind = (spec.bindings || []).map(function(_) {
    return {
      state: null,
      param: extend({}, _)
    };
  });

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  root.source = ctx.data.root.input;
  view.pulse(
    ctx.data.root.input,
    view.changeset().insert(root.items)
  );

  // initialize background color
  view._background = ctx.background || null;

  // initialize event configuration
  view._eventConfig = initializeEventConfig(ctx.eventConfig);

  // initialize view size
  view._width = view.width();
  view._height = view.height();
  view._viewWidth = viewWidth(view, view._width);
  view._viewHeight = viewHeight(view, view._height);
  view._origin = [0, 0];
  view._resize = 0;
  view._autosize = 1;
  initializeResize(view);

  // initialize cursor
  cursor(view);
}

var prototype = inherits(View, Dataflow);

// -- DATAFLOW / RENDERING ----

prototype.run = function(encode) {
  Dataflow.prototype.run.call(this, encode);
  if (this._redraw || this._resize) {
    try {
      this.render();
    } catch (e) {
      this.error(e);
    }
  }
  return this;
};

prototype.render = function() {
  if (this._renderer) {
    if (this._resize) {
      this._resize = 0;
      resizeRenderer(this);
    }
    this._renderer.render(this._scenegraph.root);
  }
  this._redraw = false;
  return this;
};

prototype.dirty = function(item) {
  this._redraw = true;
  this._renderer && this._renderer.dirty(item);
};

// -- GET / SET ----

prototype.container = function() {
  return this._el;
};

prototype.scenegraph = function() {
  return this._scenegraph;
};

function lookupSignal(view, name) {
  return view._signals.hasOwnProperty(name)
    ? view._signals[name]
    : error('Unrecognized signal name: ' + stringValue(name));
}

prototype.signal = function(name, value, options) {
  var op = lookupSignal(this, name);
  return arguments.length === 1
    ? op.value
    : this.update(op, value, options);
};

prototype.background = function(_) {
  if (arguments.length) {
    this._background = _;
    this._resize = 1;
    return this;
  } else {
    return this._background;
  }
};

prototype.width = function(_) {
  return arguments.length ? this.signal('width', _) : this.signal('width');
};

prototype.height = function(_) {
  return arguments.length ? this.signal('height', _) : this.signal('height');
};

prototype.padding = function(_) {
  return arguments.length ? this.signal('padding', _) : this.signal('padding');
};

prototype.autosize = function(_) {
  return arguments.length ? this.signal('autosize', _) : this.signal('autosize');
};

prototype.renderer = function(type) {
  if (!arguments.length) return this._renderType;
  if (!renderModule(type)) error('Unrecognized renderer type: ' + type);
  if (type !== this._renderType) {
    this._renderType = type;
    if (this._renderer) {
      this._renderer = null;
      this.initialize(this._el);
    }
  }
  return this;
};

prototype.loader = function(loader) {
  if (!arguments.length) return this._loader;
  if (loader !== this._loader) {
    Dataflow.prototype.loader.call(this, loader);
    if (this._renderer) {
      this._renderer = null;
      this.initialize(this._el);
    }
  }
  return this;
};

prototype.resize = function() {
  this._autosize = 1;
  return this;
};

// -- SIZING ----
prototype._resizeView = resizeView;

// -- EVENT HANDLING ----

prototype.addEventListener = function(type, handler) {
  this._handler.on(type, handler);
  return this;
};

prototype.removeEventListener = function(type, handler) {
  this._handler.off(type, handler);
  return this;
};

prototype.addResizeListener = function(handler) {
  var l = this._resizeListeners;
  if (l.indexOf(handler) < 0) {
    // add handler if it isn't already registered
    l.push(handler);
  }
  return this;
};

prototype.removeResizeListener = function(handler) {
  var l = this._resizeListeners,
      i = l.indexOf(handler);
  if (i >= 0) {
    l.splice(i, 1);
  }
  return this;
};

function findHandler(signal, handler) {
  var t = signal._targets || [],
      h = t.filter(function(op) {
            var u = op._update;
            return u && u.handler === handler;
          });
  return h.length ? h[0] : null;
}

prototype.addSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      h = findHandler(s, handler);

  if (!h) {
    h = function() { handler(name, s.value); };
    h.handler = handler;
    this.on(s, null, h);
  }
  return this;
};

prototype.removeSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      h = findHandler(s, handler);

  if (h) s._targets.remove(h);
  return this;
};

prototype.preventDefault = function(_) {
  if (arguments.length) {
    this._preventDefault = _;
    return this;
  } else {
    return this._preventDefault;
  }
};

prototype.tooltipHandler = function(_) {
  var h = this._handler;
  if (!arguments.length) {
    return h.handleTooltip;
  } else {
    h.handleTooltip = _ || Handler.prototype.handleTooltip;
    return this;
  }
};

prototype.events = events;
prototype.finalize = finalize;
prototype.hover = hover;

// -- DATA ----
prototype.data = data;
prototype.change = change;
prototype.insert = insert;
prototype.remove = remove;

// -- INITIALIZATION ----
prototype.initialize = initialize;

// -- HEADLESS RENDERING ----
prototype.toImageURL = renderToImageURL;
prototype.toCanvas = renderToCanvas;
prototype.toSVG = renderToSVG;

// -- SAVE / RESTORE STATE ----
prototype.getState = getState;
prototype.setState = setState;

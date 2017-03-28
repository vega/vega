import cursor from './cursor';
import {data, change, insert, remove} from './data';
import events from './events';
import hover from './hover';
import finalize from './finalize';
import initialize from './initialize';
import renderToImageURL from './render-to-image-url';
import renderToCanvas from './render-to-canvas';
import renderToSVG from './render-to-svg';
import {resizeRenderer} from './render-size';
import runtime from './runtime';
import {autosize, resizer} from './size';
import {getState, setState} from './state';

import {Dataflow} from 'vega-dataflow';
import {inherits, stringValue} from 'vega-util';
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
  options = options || {};

  Dataflow.call(this);
  this.loader(options.loader || this._loader);
  this.logLevel(options.logLevel || 0);

  this._el = null;
  this._renderType = options.renderer || RenderType.Canvas;
  this._scenegraph = new Scenegraph();
  var root = this._scenegraph.root;

  // initialize renderer and render queue
  this._renderer = null;
  this._queue = null;

  // initialize handler and event management
  this._handler = new CanvasHandler().scene(root);
  this._eventListeners = [];
  this._preventDefault = true;

  // initialize dataflow graph
  var ctx = runtime(this, spec, options.functions);
  this._runtime = ctx;
  this._signals = ctx.signals;
  this._bind = (spec.bindings || [])
    .map(function(_) { return {state: null, param: _}; });

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  root.source = ctx.data.root.input;
  this.pulse(
    ctx.data.root.input,
    this.changeset().insert(root.items)
  );

  // initialize background color
  this._background = ctx.background || null;

  // initialize view size
  this._width = this.width();
  this._height = this.height();
  this._origin = [0, 0];
  this._resize = 0;
  this._autosize = 1;

  // initialize resize operators
  this._resizeWidth = resizer(this, 'width');
  this._resizeHeight = resizer(this, 'height');

  // initialize cursor
  cursor(this);
}

var prototype = inherits(View, Dataflow);

// -- DATAFLOW / RENDERING ----

prototype.run = function(encode) {
  Dataflow.prototype.run.call(this, encode);

  var q = this._queue;
  if (this._resize || !q || q.length) {
    this.render(q);
    this._queue = [];
  }

  return this;
};

prototype.render = function(update) {
  if (this._renderer) {
    if (this._resize) this._resize = 0, resizeRenderer(this);
    this._renderer.render(this._scenegraph.root, update);
  }
  return this;
};

prototype.enqueue = function(items) {
  if (this._queue && items && items.length) {
    this._queue = this._queue.concat(items);
  }
};

// -- GET / SET ----

function lookupSignal(view, name) {
  return view._signals.hasOwnProperty(name)
    ? view._signals[name]
    : view.error('Unrecognized signal name: ' + stringValue(name));
}

prototype.signal = function(name, value, options) {
  var op = lookupSignal(this, name);
  return arguments.length === 1
    ? op.value
    : this.update(op, value, options);
};

prototype.scenegraph = function() {
  return this._scenegraph;
};

prototype.background = function(_) {
  return arguments.length ? (this._background = _, this._resize = 1, this) : this._background;
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

prototype.renderer = function(type) {
  if (!arguments.length) return this._renderType;
  if (!renderModule(type)) this.error('Unrecognized renderer type: ' + type);
  if (type !== this._renderType) {
    this._renderType = type;
    if (this._renderer) {
      this._renderer = this._queue = null;
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
      this._renderer = this._queue = null;
      this.initialize(this._el);
    }
  }
  return this;
};

// -- EVENT HANDLING ----

prototype.addEventListener = function(type, handler) {
  this._handler.on(type, handler);
};

prototype.removeEventListener = function(type, handler) {
  this._handler.off(type, handler);
};

prototype.addSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      h = function() { handler(name, s.value); };
  this.on(s, null, (h.handler = handler, h));
};

prototype.removeSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      t = s._targets || [],
      h = t.filter(function(op) {
            var u = op._update;
            return u && u.handler === handler;
          });
  if (h.length) t.remove(h[0]);
};

prototype.preventDefault = function(_) {
  return arguments.length ? (this._preventDefault = _, this) : this._preventDefault;
};

prototype.tooltipHandler = function(_) {
  var h = this._handler;
  return !arguments.length ? h.handleTooltip
    : (h.handleTooltip = (_ || Handler.prototype.handleTooltip), this);
};

prototype.events = events;
prototype.finalize = finalize;
prototype.hover = hover;

// -- SIZING ----
prototype.autosize = autosize;

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

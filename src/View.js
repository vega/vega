import * as transforms from './transforms/index';

import {
  Dataflow,
  EventStream,
  changeset
} from 'vega-dataflow';

import {
  parse,
  context
} from 'vega-runtime';

import {
  CanvasRenderer,
  CanvasHandler,
  SVGRenderer,
  SVGHandler,
  SVGStringRenderer,
  Scenegraph,
  point
} from 'vega-scenegraph';

import {
  inherits
} from 'vega-util';

// constants
var CANVAS = 'canvas',
    PNG = 'png',
    SVG = 'svg';

/**
 * Create a new View instance from a Vega dataflow runtime specification.
 * The generated View will not immediately be ready for display. Callers
 * should also invoke the initialize method (e.g., to set the parent
 * DOM element in browser-based deployment) and then invoke the run
 * method to evaluate the dataflow graph. Rendering will automatically
 * be peformed upon dataflow runs.
 * @constructor
 * @param {object} runtimeSpec - The Vega dataflow runtime specification.
 */
export default function View(runtimeSpec) {
  Dataflow.call(this);

  this._el = null;
  this._renderType = CANVAS;
  this._loadConfig = {};
  this._scenegraph = new Scenegraph();
  var root = this._scenegraph.root;

  this._renderer = null;
  this._handler = new CanvasHandler().scene(root);
  this._queue = null;
  this._eventListeners = [];

  // initialize dataflow graph
  var ctx = parse(runtimeSpec, context(this, transforms));
  self.context = ctx; // DEBUG
  this._signals = ctx.signals;
  this._data = ctx.data;

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  this.pulse(
    this._data.root.input,
    changeset().insert(root.items)
  );

  // background color
  this._backgroundColor = null;

  // initialize resize operator
  this.add(null,
    function(_, pulse) { pulse.dataflow.resize(_.width, _.height); },
    {width: this._signals.width, height: this._signals.height}
  );
}

var prototype = inherits(View, Dataflow);

// -- INITIALIZATION -----

prototype.initialize = function(el) {
  var view = this;

  // containing dom element
  if (el) {
    if (typeof el === 'string' && typeof document !== 'undefined') {
      el = document.querySelector(el);
    }
    el.innerHTML = ''; // clear
    view._el = el;
  } else {
    view._el = null; // headless
  }

  // renderer and input handler
  var io = getIO(view._renderType, el);
  view._renderer = initializeRenderer(view, view._renderer, el, io.Renderer);
  view._handler = initializeHandler(view, view._handler, el, io.Handler);

  return view;
};

function initializeRenderer(view, r, el, constructor) {
  r = r || new constructor(view._loadConfig);
  return r
    .initialize(el, view.width(), view.height(), view.padding())
    .background(view._backgroundColor);
}

function initializeHandler(view, prevHandler, el, constructor) {
  var handler = new constructor()
    .scene(view.scenegraph().root)
    .initialize(el, view.padding(), view);

  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      handler.on(h.type, h.handler);
    });
  }

  return handler;
}

function getIO(type, el) {
  var r = CanvasRenderer,
      h = CanvasHandler;
  if (type === SVG) {
    r = el ? SVGRenderer : SVGStringRenderer;
    h = SVGHandler;
  }
  return {Renderer: r, Handler: h};
}

// -- SCENEGRAPH and RENDERING -----

prototype.scenegraph = function() {
  return this._scenegraph;
};

prototype.renderer = function(type) {
  if (!arguments.length) return this._renderType;
  if (type !== SVG) type = CANVAS;
  if (type !== this._renderType) {
    this._renderType = type;
    if (this._renderer) {
      this._renderer = this._queue = null;
      this.initialize(this._el);
    }
  }
  return this;
};

prototype.render = function(items) {
  return this._renderer.render(this._scenegraph.root, items), this;
};

prototype.renderQueue = function(items) {
  if (this._queue && items && items.length) {
    this._queue = this._queue.concat(items);
  }
};

/**
 * Generate an image URL for the visualization. Depending on the type
 * parameter, the generated URL contains data for either a PNG or SVG image.
 * The URL can be used (for example) to download images of the visualization.
 * This method is asynchronous, with the generated url returned via a callback
 * function (the underlying renderer will complete image loading, if needed,
 * before returning).
 * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
 *   The 'canvas' and 'png' types are synonyms for a PNG image.
 * @param {function} callback - A callback function for returning the
 *   error state (first argument) or image url (second argument).
 */
prototype.toImageURL = function(type, callback) {
  if (type === PNG) type = CANVAS;

  if (type !== SVG && type !== CANVAS) {
    callback('Unrecognized image type: ' + type);
  } else {
    renderHeadless(this, type, function(error, renderer) {
      if (error) { callback(error); return; }
      try {
        callback(null, type === CANVAS
          ? renderer.canvas().toDataURL('image/png')
          : window.URL.createObjectURL(
              new Blob([renderer.svg()], {type: 'image/svg+xml'}))
        );
      } catch (error) {
        callback(error);
      }
    });
  }
};

/**
 * Returns a rendered SVG string of the visualization. This method is
 * asynchronous, with the generated url returned via a callback function
 * (the underlying renderer will complete image loading before returning).
 * @param {function} callback - A callback function for returning the
 *   error state (first argument) or svg string (second argument).
 */
prototype.toSVG = function(callback) {
  renderHeadless(this, SVG, function(error, renderer) {
    callback(error, renderer ? renderer.svg() : undefined);
  });
};

/**
 * Returns a Canvas instance containing a rendered visualization.
 * This method is asynchronous, with the generated url returned via a
 * callback function (the underlying renderer will complete image loading
 * before returning). If this View is using a canvas renderer, the
 * returned Canvas instance will be the same as the live instance used
 * by the renderer, and thus subject to change over time. Any
 * methods for exporting canvas state should be called immediately.
 * @param {function} callback - A callback function for returning the
 *   error state (first argument) or Canvas instance (second argument).
 */
prototype.toCanvas = function(callback) {
  renderHeadless(this, CANVAS, function(error, renderer) {
    callback(error, renderer ? renderer.canvas() : undefined);
  });
};

/**
 * Render the current scene in a headless fashion.
 */
function renderHeadless(view, type, callback) {
  var renderer = view._renderer,
      scaled = type === CANVAS
            && typeof window !== 'undefined'
            && window.devicePixelRatio > 1;

  if (scaled || !renderer || view.renderer() !== type) {
    renderer = initializeRenderer(view, null, null,
      (type === SVG) ? SVGStringRenderer : CanvasRenderer);
  }

  renderAsync(renderer, view._scenegraph.root, callback);
}

/**
 * Perform asynchronous rendering and return the renderer via callback.
 */
function renderAsync(renderer, scene, callback) {
  var redraw = false;

  function poll() {
    if (renderer.pendingImages() === 0) {
      try {
        if (redraw) renderer.render(scene);
        callback(null, renderer);
      } catch (error) {
        callback(error);
      }
    } else {
      redraw = true;
      setTimeout(poll, 10);
    }
  }

  try {
    renderer.render(scene);
  } catch (error) {
    callback(error);
  }

  poll();
}

// -- DATAFLOW METHODS -----

prototype.run = function() {
  Dataflow.prototype.run.call(this);
  if (!this._queue || this._queue.length) {
    this.render(this._queue);
    this._queue = [];
  }
  return this;
};

prototype.signal = function(name, value, options) {
  var op = this._signals[name];
  return arguments.length === 1
    ? (op ? op.value : undefined)
    : this.update(op, value, options);
};

prototype.resize = function(width, height) {
  var w = this.width(),
      h = this.height();

  if (w === width && h === height) {
    this._renderer.resize(width, height, this.padding());
  } else {
    this.width(width);
    this.height(height);
    this.run();
  }

  return this;
};

prototype.width = function(value) {
  return arguments.length ? this.signal('width', value) : this.signal('width');
};

prototype.height = function(value) {
  return arguments.length ? this.signal('height', value) : this.signal('height');
};

prototype.padding = function(value) {
  return arguments.length ? this.signal('padding', value) : this.signal('padding');
};

// -- EVENT HANDLING -----

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @return {EventStream}
 */
prototype.events = function(source, type, filter) {
  var view = this,
      s = new EventStream(filter),
      send = function(e, item) {
        s.receive(view.extendEvent(e, item));
        view.run();
      },
      sources;

  if (source === 'view') {
    this._handler.on(type, send);
    return s;
  }

  if (source === 'window') {
    sources = [window];
  } else if (typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  this._eventListeners.push({
    type:    type,
    sources: sources,
    handler: send
  });

  return s;
};

/**
 * Extend an event with additional view-specific information.
 * Adds properties for this view ('view') and any actively selected
 * item ('item'). If this view has a containing DOM element, also
 * adds ('viewX', 'viewY') properties indicating the primary mouse or
 * touch coordinates relative to the view's coordinate system.
 * @param {Event} event - The input event to extend.
 * @param {Item} item - The currently selected scenegraph item (if any).
 * @return {Event} - The extended input event.
 */
prototype.extendEvent = function(event, item) {
  event.dataflow = this;
  event.item = item;

  var el = this._renderer.element(), e, p, pad;
  if (el) {
    pad = this.padding();
    e = event.changedTouches ? event.changedTouches[0] : event;
    p = point(e, el);
    event.viewX = p[0] - pad.left;
    event.viewY = p[1] - pad.top;
  }

  return event;
};

/**
 * Remove all external event listeners.
 */
prototype.destroy = function() {
  var listeners = this._eventListeners,
      n = listeners.length, m, e;

  while (--n >= 0) {
    e = listeners[n];
    m = e.sources.length;
    while (--m >= 0) {
      e.sources[m].removeEventListener(e.type, e.handler);
    }
  }
};

prototype.changeset = changeset;

// -- SAVE / RESTORE STATE -----

/**
 * Get or set the current signal state. If an input object is provided,
 * all property on that object will be assigned to signals of this view,
 * and the run method will be invoked. If no argument is provided,
 * returns a hash of all current signal values.
 * @param {object} [state] - The state vector to set.
 * @return {object|View} - If invoked with arguments, returns the
 *   current signal state. Otherwise returns this View instance.
 */
prototype.state = function(state) {
  var key, skip;
  if (arguments.length) {
    skip = {skip: true};
    for (key in state) this.signal(key, state[key], skip);
    return this.run();
  } else {
    state = {};
    for (key in this._signals) state[key] = this.signal(key);
    return state;
  }
};

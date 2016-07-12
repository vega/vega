import * as transforms from './transforms/index';
import {Dataflow, EventStream, changeset, inherits} from 'vega-dataflow';
import {parse, context} from 'vega-runtime';

import {
  CanvasRenderer,
  CanvasHandler,
  SVGRenderer,
  SVGHandler,
  SVGStringRenderer,
  Scenegraph,
  point
} from 'vega-scenegraph';

export default function View(runtimeSpec) {
  Dataflow.call(this);

  this._el = null;
  this._io = null;
  this._renderType = 'canvas';
  this._loadConfig = {};
  this._scenegraph = new Scenegraph();
  var root = this._scenegraph.root;

  this._renderer = null;
  this._handler = new CanvasHandler().scene(root);
  this._queue = null;
  this._eventListeners = [];

  // initialize dataflow graph
  var ctx = parse(runtimeSpec, context(this, transforms));
  this._signals = ctx.signals;
  this._data = ctx.data;

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  this.pulse(
    this._data.__marks__.input,
    changeset().insert(root.items)
  );

  // initialize padding
  this._padding = {top:5, left:5, bottom:5, right:5};

  // initialize resize operator
  this.add(null,
    function(_, pulse) { pulse.dataflow.resize(_.width, _.height); },
    {width: this._signals.width, height: this._signals.height}
  );
}

var prototype = inherits(View, Dataflow);

// -- CONFIGURATION -----

prototype.initialize = function(el) {
  var view = this;

  if (el) {
    if (typeof el === 'string' && typeof document !== 'undefined') {
      el = document.querySelector(el);
    }
    el.innerHTML = ''; // clear
    view._el = el;
  } else {
    view._el = null; // headless
  }

  // TODO: settings...
  var w = view.width();
  var h = view.height();
  var backgroundColor = null;
  var pad = view._padding;
  var loadConfig = view._loadConfig;
  var io = (view._io = getIO(view._renderType, el));

  // renderer
  view._renderer = (view._renderer || new io.Renderer(loadConfig))
    .initialize(el, w, h, pad)
    .background(backgroundColor);

  // input handler
  var prevHandler = view._handler;

  view._handler = new io.Handler()
    .scene(view.scenegraph().root)
    .initialize(el, pad, view);

  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      view._handler.on(h.type, h.handler);
    });
  }

  return view;
};

function getIO(type, el) {
  var r = CanvasRenderer,
      h = CanvasHandler;
  if (type === 'svg') {
    r = el ? SVGRenderer : SVGStringRenderer;
    h = SVGHandler;
  }
  return {Renderer: r, Handler: h};
}

prototype.renderer = function(type) {
  if (!arguments.length) return this._renderType;
  if (type !== 'svg') type = 'canvas';
  if (type !== this._renderType) {
    this._renderType = type;
    if (this._renderer) {
      this._renderer = this._queue = null;
      this.initialize(this._el);
    }
  }
  return this;
};

// -- SCENEGRAPH and RENDERING -----

prototype.resize = function(width, height) {
  var w = this.signal('width'),
      h = this.signal('height');

  if (w === width && h === height) {
    this._renderer.resize(width, height, this._padding);
  } else {
    this.signal('width', width).signal('height', height).run();
  }

  return this;
};

prototype.scenegraph = function() {
  return this._scenegraph;
};

prototype.render = function(items) {
  return this._renderer.render(this._scenegraph.root, items), this;
};

prototype.renderQueue = function(items) {
  if (this._queue && items && items.length) {
    this._queue = this._queue.concat(items);
  }
};

prototype.run = function() {
  Dataflow.prototype.run.call(this);
  if (!this._queue || this._queue.length) {
    this.render(this._queue);
    this._queue = [];
  }
  return this;
}

// -- DATAFLOW METHODS -----

prototype.signal = function(name, value, options) {
  var op = this._signals[name];
  return arguments.length === 1
    ? (op ? op.value : undefined)
    : this.update(op, value, options);
};

prototype.width = function(value) {
  return arguments.length ? this.signal('width', value) : this.signal('width');
};

prototype.height = function(value) {
  return arguments.length ? this.signal('height', value) : this.signal('height');
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
 * @param {Event} event - The input event to extend.
 * @param {Item} item - The currently selected scenegraph item (if any).
 * @return {Event} - The extended input event.
 */
prototype.extendEvent = function(event, item) {
  event.dataflow = this;
  event.item = item;

  var el = this._renderer.element(), p;
  if (el) {
    p = point(event, el);
    event.viewX = p[0] - this._padding.left;
    event.viewY = p[1] - this._padding.top;
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

import {data, insert, remove} from './data';
import events from './events';
import hover from './hover';
import finalize from './finalize';
import initialize from './initialize';
import renderToImageURL from './render-to-image-url';
import renderToCanvas from './render-to-canvas';
import renderToSVG from './render-to-svg';
import runtime from './runtime';
import state from './state';

import {
  CANVAS,
  SVG
} from './render-types';

import {
  Dataflow
} from 'vega-dataflow';

import {
  CanvasHandler,
  Scenegraph
} from 'vega-scenegraph';

import {
  inherits
} from 'vega-util';

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
export default function View(spec) {
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
  var ctx = runtime(this, spec);
  self.context = ctx; // DEBUG
  this._signals = ctx.signals;
  this._scales = ctx.scales;
  this._data = ctx.data;

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  this.pulse(
    this._data.root.input,
    this.changeset().insert(root.items)
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

// -- DATAFLOW / RENDERING ----

prototype.run = function() {
  Dataflow.prototype.run.call(this);
  if (!this._queue || this._queue.length) {
    this.render(this._queue);
    this._queue = [];
  }
  return this;
};

prototype.render = function(update) {
  this._renderer.render(this._scenegraph.root, update);
  return this;
};

prototype.enqueue = function(items) {
  if (this._queue && items && items.length) {
    this._queue = this._queue.concat(items);
  }
};

// -- GET / SET ----

prototype.signal = function(name, value, options) {
  var op = this._signals[name];
  return arguments.length === 1
    ? (op ? op.value : undefined)
    : this.update(op, value, options);
};

prototype.scenegraph = function() {
  return this._scenegraph;
};

prototype.background = function(_) {
  return arguments.length ? this._backgroundColor = _ : this._backgroundColor;
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

// -- DATA ----
prototype.data = data;
prototype.insert = insert;
prototype.remove = remove;

// -- INITIALIZATION ----
prototype.initialize = initialize;

// -- HEADLESS RENDERING ----
prototype.toImageURL = renderToImageURL;
prototype.toCanvas = renderToCanvas;
prototype.toSVG = renderToSVG;

// -- EVENT HANDLING ----
prototype.events = events;
prototype.finalize = finalize;
prototype.hover = hover;

// -- SAVE / RESTORE STATE ----
prototype.state = state;

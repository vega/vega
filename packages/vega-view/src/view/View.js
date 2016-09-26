import bind from './bind';
import cursor from './cursor';
import {data, insert, remove} from './data';
import events from './events';
import hover from './hover';
import finalize from './finalize';
import initialize from './initialize';
import {Canvas, None, SVG} from './render-types';
import renderToImageURL from './render-to-image-url';
import renderToCanvas from './render-to-canvas';
import renderToSVG from './render-to-svg';
import {resizeRenderer} from './render-size';
import runtime from './runtime';
import {autosize, resizer} from './size';
import state from './state';
import {Dataflow} from 'vega-dataflow';
import {CanvasHandler, Scenegraph} from 'vega-scenegraph';
import {inherits} from 'vega-util';

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
  this.loadOptions(options.loadOptions || {});
  this.logLevel(options.logLevel || 0);

  this._el = null;
  this._renderType = options.renderer || Canvas;
  this._scenegraph = new Scenegraph();
  var root = this._scenegraph.root;

  // initialize renderer and handler
  this._renderer = null;
  this._handler = new CanvasHandler().scene(root);
  this._queue = null;
  this._eventListeners = [];

  // initialize dataflow graph
  var ctx = runtime(this, spec);
  this._signals = ctx.signals;
  this._scales = ctx.scales;
  this._data = ctx.data;
  this._bind = spec.bindings;

  // DEBUG - remove later
  if (typeof self !== 'undefined') self.context = ctx;

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  root.source = this._data.root.input;
  this.pulse(
    this._data.root.input,
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
  if (type !== SVG && type !== None) type = Canvas;
  if (type !== this._renderType) {
    this._renderType = type;
    if (this._renderer) {
      this._renderer = this._queue = null;
      this.initialize(this._el);
    }
  }
  return this;
};

// -- SIZING ----
prototype.autosize = autosize;

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

// -- INPUT BINDING ---
prototype.bind = bind;

// -- SAVE / RESTORE STATE ----
prototype.state = state;

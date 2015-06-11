var d3 = require('d3'),
    Handler = require('../Handler'),
    marks = require('./marks');

function CanvasHandler() {
  Handler.call(this);
  this._down = null;
}

var base = Handler.prototype;
var prototype = (CanvasHandler.prototype = Object.create(base));
prototype.constructor = CanvasHandler;

prototype.initialize = function(el, pad, obj) {
  base.initialize.call(this, el, pad, obj);
  var canvas = this._canvas = d3.select(this._el).select("canvas.marks").node();
  
  // add event listeners
  var that = this;
  events.forEach(function(type) {
    canvas.addEventListener(type, function(evt) {
      if (prototype[type]) {
        prototype[type].call(that, evt);
      } else {
        that.fire(type, evt);
      }
    });
  });
  return this;
};

// setup events
var events = [
  "keydown",
  "keypress",
  "keyup",
  "mousedown",
  "mouseup",
  "mousemove",
  "mouseout",
  "click",
  "dblclick",
  "wheel",
  "mousewheel",
  "touchstart",
  "touchmove",
  "touchend"
];

prototype.mousemove = function(evt) {
  var pad = this._padding,
      b = evt.target.getBoundingClientRect(),
      x = evt.clientX - b.left,
      y = evt.clientY - b.top,
      a = this._active,
      p = this.pick(this._model.scene(), x, y, x-pad.left, y-pad.top);

  if (p === a) {
    this.fire("mousemove", evt);
    if (evt.type === "touchmove") this.fire("touchmove", evt);
    return;
  } else if (a) {
    this.fire("mouseout", evt);
    if (evt.type === "touchend") this.fire("touchend", evt);
  }
  this._active = p;
  if (p) {
    this.fire("mouseover", evt);
    if (evt.type === "touchstart") this.fire("touchstart", evt);
  }
};

prototype.mouseout = function(evt) {
  if (this._active) {
    this.fire("mouseout", evt);
    this.fire("touchend", evt);
  }
  this._active = null;
};

prototype.mousedown = function(evt) {
  this._down = this._active;
  this.fire("mousedown", evt);
};

prototype.click = function(evt) {
  if (this._down === this._active) {
    this.fire("click", evt);
    this._down = null;
  }
};

// to keep firefox happy
prototype.DOMMouseScroll = function(evt) {
  this.fire("mousewheel", evt);
};

prototype.touchmove = prototype.mousemove;

prototype.touchend = prototype.mouseout;

// fire an event
prototype.fire = function(type, evt) {
  var a = this._active,
      h = this._handlers[type], i, len;
  if (h) {
    for (i=0, len=h.length; i<len; ++i) {
      h[i].handler.call(this._obj, evt, a);
    }
  }
};

// add an event handler
prototype.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers;
  (h[name] || (h[name] = [])).push({
    type: type,
    handler: handler
  });
  return this;
};

// remove an event handler
prototype.off = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers[name], i;
  if (!h) return;
  for (i=h.length; --i>=0;) {
    if (h[i].type !== type) continue;
    if (!handler || h[i].handler === handler) h.splice(i, 1);
  }
  return this;
};

// retrieve the current canvas context
prototype.context = function() {
  return this._canvas.getContext("2d");
};

// find the scenegraph item at the current mouse position
// x, y -- the absolute x, y mouse coordinates on the canvas element
// gx, gy -- the relative coordinates within the current group
prototype.pick = function(scene, x, y, gx, gy) {
  var g = this.context(),
      mark = marks[scene.marktype];
  return mark.pick.call(this, g, scene, x, y, gx, gy);
};

module.exports = CanvasHandler;

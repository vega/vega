var DOM = require('../../util/dom'),
    Handler = require('../Handler'),
    marks = require('./marks');

function CanvasHandler() {
  Handler.call(this);
  this._down = null;
  this._touch = null;
  this._first = true;
}

var base = Handler.prototype;
var prototype = (CanvasHandler.prototype = Object.create(base));
prototype.constructor = CanvasHandler;

prototype.initialize = function(el, pad, obj) {
  // add event listeners
  var canvas = this._canvas = DOM.find(el, 'canvas');
  if (canvas) {
    var that = this;
    this.events.forEach(function(type) {
      canvas.addEventListener(type, function(evt) {
        if (prototype[type]) {
          prototype[type].call(that, evt);
        } else {
          that.fire(type, evt);
        }
      });
    });
  }

  return base.initialize.call(this, el, pad, obj);
};

prototype.canvas = function() {
  return this._canvas;
};

// retrieve the current canvas context
prototype.context = function() {
  return this._canvas.getContext('2d');
};

// supported events
prototype.events = [
  'keydown',
  'keypress',
  'keyup',
  'dragenter',
  'dragleave',
  'dragover',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseout',
  'mouseover',
  'click',
  'dblclick',
  'wheel',
  'mousewheel',
  'touchstart',
  'touchmove',
  'touchend'
];

// to keep firefox happy
prototype.DOMMouseScroll = function(evt) {
  this.fire('mousewheel', evt);
};

function move(moveEvent, overEvent, outEvent) {
  return function(evt) {
    var a = this._active,
        p = this.pickEvent(evt);

    if (p === a) {
      // active item and picked item are the same
      this.fire(moveEvent, evt); // fire move
    } else {
      // active item and picked item are different
      this.fire(outEvent, evt);  // fire out for prior active item
      this._active = p;            // set new active item
      this.fire(overEvent, evt); // fire over for new active item
      this.fire(moveEvent, evt); // fire move for new active item
    }
  };
}

function inactive(type) {
  return function(evt) {
    this.fire(type, evt);
    this._active = null;
  };
}

prototype.mousemove = move('mousemove', 'mouseover', 'mouseout');
prototype.dragover  = move('dragover', 'dragenter', 'dragleave');

prototype.mouseout  = inactive('mouseout');
prototype.dragleave = inactive('dragleave');

prototype.mousedown = function(evt) {
  this._down = this._active;
  this.fire('mousedown', evt);
};

prototype.click = function(evt) {
  if (this._down === this._active) {
    this.fire('click', evt);
    this._down = null;
  }
};

prototype.touchstart = function(evt) {
  this._touch = this.pickEvent(evt.changedTouches[0]);

  if (this._first) {
    this._active = this._touch;
    this._first = false;
  }

  this.fire('touchstart', evt, true);
};

prototype.touchmove = function(evt) {
  this.fire('touchmove', evt, true);
};

prototype.touchend = function(evt) {
  this.fire('touchend', evt, true);
  this._touch = null;
};

// fire an event
prototype.fire = function(type, evt, touch) {
  var a = touch ? this._touch : this._active,
      h = this._handlers[type], i, len;
  if (h) {
    evt.vegaType = type;
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

prototype.pickEvent = function(evt) {
  var rect = this._canvas.getBoundingClientRect(),
      pad = this._padding, x, y;
  return this.pick(this._scene,
    x = (evt.clientX - rect.left),
    y = (evt.clientY - rect.top),
    x - pad.left, y - pad.top);
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

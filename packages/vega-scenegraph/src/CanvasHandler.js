import Handler from './Handler';
import Marks from './marks/index';
import {Events, HrefEvent, TooltipShowEvent, TooltipHideEvent} from './util/events';
import point from './util/point';
import {domFind} from './util/dom';
import {inherits} from 'vega-util';

export default function CanvasHandler(loader, tooltip) {
  Handler.call(this, loader, tooltip);
  this._down = null;
  this._touch = null;
  this._first = true;
}

var prototype = inherits(CanvasHandler, Handler);

prototype.initialize = function(el, origin, obj) {
  // add event listeners
  var canvas = this._canvas = el && domFind(el, 'canvas');
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

  return Handler.prototype.initialize.call(this, el, origin, obj);
};

// return the backing canvas instance
prototype.canvas = function() {
  return this._canvas;
};

// retrieve the current canvas context
prototype.context = function() {
  return this._canvas.getContext('2d');
};

// supported events
prototype.events = Events;

// to keep old versions of firefox happy
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
      if (!a || !a.exit) {
        // fire out for prior active item
        // suppress if active item was removed from scene
        this.fire(outEvent, evt);
      }
      this._active = p;          // set new active item
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

  // set event type relative to scenegraph items
  evt.vegaType = type;

  // handle hyperlinks and tooltips first
  if (type === HrefEvent && a && a.href) {
    this.handleHref(evt, a, a.href);
  } else if (type === TooltipShowEvent || type === TooltipHideEvent) {
    this.handleTooltip(evt, a, type !== TooltipHideEvent);
  }

  // invoke all registered handlers
  if (h) {
    for (i=0, len=h.length; i<len; ++i) {
      h[i].handler.call(this._obj, evt, a);
    }
  }
};

// add an event handler
prototype.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers,
      i = this._handlerIndex(h[name], type, handler);

  if (i < 0) {
    (h[name] || (h[name] = [])).push({
      type:    type,
      handler: handler
    });
  }

  return this;
};

// remove an event handler
prototype.off = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers[name],
      i = this._handlerIndex(h, type, handler);

  if (i >= 0) {
    h.splice(i, 1);
  }

  return this;
};

prototype.pickEvent = function(evt) {
  var p = point(evt, this._canvas),
      o = this._origin;
  return this.pick(this._scene, p[0], p[1], p[0] - o[0], p[1] - o[1]);
};

// find the scenegraph item at the current mouse position
// x, y -- the absolute x, y mouse coordinates on the canvas element
// gx, gy -- the relative coordinates within the current group
prototype.pick = function(scene, x, y, gx, gy) {
  var g = this.context(),
      mark = Marks[scene.marktype];
  return mark.pick.call(this, g, scene, x, y, gx, gy);
};

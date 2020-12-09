import Handler from './Handler';
import Marks from './marks/index';
import {
  ClickEvent, DragEnterEvent, DragLeaveEvent, DragOverEvent, Events,
  HrefEvent, MouseDownEvent, MouseMoveEvent, MouseOutEvent, MouseOverEvent,
  MouseWheelEvent, TooltipHideEvent, TooltipShowEvent,
  TouchEndEvent, TouchMoveEvent, TouchStartEvent
} from './util/events';
import point from './util/point';
import {domFind} from './util/dom';
import {inherits} from 'vega-util';

export default function CanvasHandler(loader, tooltip) {
  Handler.call(this, loader, tooltip);
  this._down = null;
  this._touch = null;
  this._first = true;
  this._events = {};
}

const eventBundle = type => (
  type === TouchStartEvent ||
  type === TouchMoveEvent ||
  type === TouchEndEvent
)
? [TouchStartEvent, TouchMoveEvent, TouchEndEvent]
: [type];

// lazily add listeners to the canvas as needed
function eventListenerCheck(handler, type) {
  eventBundle(type).forEach(_ => addEventListener(handler, _));
}

function addEventListener(handler, type) {
  const canvas = handler.canvas();
  if (canvas && !handler._events[type]) {
    handler._events[type] = 1;
    canvas.addEventListener(type, handler[type]
      ? evt => handler[type](evt)
      : evt => handler.fire(type, evt)
    );
  }
}

function move(moveEvent, overEvent, outEvent) {
  return function(evt) {
    const a = this._active,
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

inherits(CanvasHandler, Handler, {
  initialize(el, origin, obj) {
    this._canvas = el && domFind(el, 'canvas');

    // add minimal events required for proper state management
    [ClickEvent, MouseDownEvent, MouseMoveEvent, MouseOutEvent, DragLeaveEvent]
      .forEach(type => eventListenerCheck(this, type));

    return Handler.prototype.initialize.call(this, el, origin, obj);
  },

  // return the backing canvas instance
  canvas() {
    return this._canvas;
  },

  // retrieve the current canvas context
  context() {
    return this._canvas.getContext('2d');
  },

  // supported events
  events: Events,

  // to keep old versions of firefox happy
  DOMMouseScroll(evt) {
    this.fire(MouseWheelEvent, evt);
  },

  mousemove: move(MouseMoveEvent, MouseOverEvent, MouseOutEvent),
  dragover: move(DragOverEvent, DragEnterEvent, DragLeaveEvent),

  mouseout: inactive(MouseOutEvent),
  dragleave: inactive(DragLeaveEvent),

  mousedown(evt) {
    this._down = this._active;
    this.fire(MouseDownEvent, evt);
  },

  click(evt) {
    if (this._down === this._active) {
      this.fire(ClickEvent, evt);
      this._down = null;
    }
  },

  touchstart(evt) {
    this._touch = this.pickEvent(evt.changedTouches[0]);

    if (this._first) {
      this._active = this._touch;
      this._first = false;
    }

    this.fire(TouchStartEvent, evt, true);
  },

  touchmove(evt) {
    this.fire(TouchMoveEvent, evt, true);
  },

  touchend(evt) {
    this.fire(TouchEndEvent, evt, true);
    this._touch = null;
  },

  // fire an event
  fire(type, evt, touch) {
    const a = touch ? this._touch : this._active,
          h = this._handlers[type];

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
      for (let i=0, len=h.length; i<len; ++i) {
        h[i].handler.call(this._obj, evt, a);
      }
    }
  },

  // add an event handler
  on(type, handler) {
    const name = this.eventName(type),
          h = this._handlers,
          i = this._handlerIndex(h[name], type, handler);

    if (i < 0) {
      eventListenerCheck(this, type);
      (h[name] || (h[name] = [])).push({
        type:    type,
        handler: handler
      });
    }

    return this;
  },

  // remove an event handler
  off(type, handler) {
    const name = this.eventName(type),
          h = this._handlers[name],
          i = this._handlerIndex(h, type, handler);

    if (i >= 0) {
      h.splice(i, 1);
    }

    return this;
  },

  pickEvent(evt) {
    const p = point(evt, this._canvas),
          o = this._origin;
    return this.pick(this._scene, p[0], p[1], p[0] - o[0], p[1] - o[1]);
  },

  // find the scenegraph item at the current mouse position
  // x, y -- the absolute x, y mouse coordinates on the canvas element
  // gx, gy -- the relative coordinates within the current group
  pick(scene, x, y, gx, gy) {
    const g = this.context(),
          mark = Marks[scene.marktype];
    return mark.pick.call(this, g, scene, x, y, gx, gy);
  }
});

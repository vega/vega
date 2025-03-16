import Handler from './Handler.js';
import Marks from './marks/index.js';
import {
  ClickEvent,
  DragEnterEvent, DragLeaveEvent, DragOverEvent, Events, HrefEvent,
  MouseDownEvent, MouseMoveEvent, MouseOutEvent, MouseOverEvent,
  MouseWheelEvent,
  PointerDownEvent, PointerMoveEvent, PointerOutEvent, PointerOverEvent,
  TooltipHideEvent, TooltipShowEvent,
  TouchEndEvent, TouchMoveEvent, TouchStartEvent
} from './util/events.js';
import point from './util/point.js';
import {domFind} from './util/dom.js';

export default class CanvasHandler extends Handler {
  constructor(loader, tooltip) {
    super(loader, tooltip);
    this._down = null;
    this._touch = null;
    this._first = true;
    this._events = {};

    // supported events
    this.events = Events;
    this.pointermove = move(
      [PointerMoveEvent, MouseMoveEvent],
      [PointerOverEvent, MouseOverEvent],
      [PointerOutEvent, MouseOutEvent]
    );

    this.dragover = move([DragOverEvent], [DragEnterEvent], [DragLeaveEvent]),

    this.pointerout = inactive([PointerOutEvent, MouseOutEvent]);
    this.dragleave = inactive([DragLeaveEvent]);
  }

  initialize(el, origin, obj) {
    this._canvas = el && domFind(el, 'canvas');

    // add minimal events required for proper state management
    [
      ClickEvent, MouseDownEvent,
      PointerDownEvent, PointerMoveEvent, PointerOutEvent,
      DragLeaveEvent
    ].forEach(type => eventListenerCheck(this, type));

    return super.initialize(el, origin, obj);
  }

  // return the backing canvas instance
  canvas() {
    return this._canvas;
  }

  // retrieve the current canvas context
  context() {
    return this._canvas.getContext('2d');
  }


  // to keep old versions of firefox happy
  DOMMouseScroll(evt) {
    this.fire(MouseWheelEvent, evt);
  }

  pointerdown(evt) {
    this._down = this._active;
    this.fire(PointerDownEvent, evt);
  }

  mousedown(evt) {
    this._down = this._active;
    this.fire(MouseDownEvent, evt);
  }

  click(evt) {
    if (this._down === this._active) {
      this.fire(ClickEvent, evt);
      this._down = null;
    }
  }

  touchstart(evt) {
    this._touch = this.pickEvent(evt.changedTouches[0]);

    if (this._first) {
      this._active = this._touch;
      this._first = false;
    }

    this.fire(TouchStartEvent, evt, true);
  }

  touchmove(evt) {
    this.fire(TouchMoveEvent, evt, true);
  }

  touchend(evt) {
    this.fire(TouchEndEvent, evt, true);
    this._touch = null;
  }

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
  }

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
  }

  // remove an event handler
  off(type, handler) {
    const name = this.eventName(type),
          h = this._handlers[name],
          i = this._handlerIndex(h, type, handler);

    if (i >= 0) {
      h.splice(i, 1);
    }

    return this;
  }

  pickEvent(evt) {
    const p = point(evt, this._canvas),
          o = this._origin;
    return this.pick(this._scene, p[0], p[1], p[0] - o[0], p[1] - o[1]);
  }

  // find the scenegraph item at the current pointer position
  // x, y -- the absolute x, y pointer coordinates on the canvas element
  // gx, gy -- the relative coordinates within the current group
  pick(scene, x, y, gx, gy) {
    const g = this.context(),
          mark = Marks[scene.marktype];
    return mark.pick.call(this, g, scene, x, y, gx, gy);
  }

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

function fireAll(handler, types, event) {
  types.forEach(type => handler.fire(type, event));
}

function move(moveEvents, overEvents, outEvents) {
  return function(evt) {
    const a = this._active,
          p = this.pickEvent(evt);

    if (p === a) {
      // active item and picked item are the same
      fireAll(this, moveEvents, evt); // fire move
    } else {
      // active item and picked item are different
      if (!a || !a.exit) {
        // fire out for prior active item
        // suppress if active item was removed from scene
        fireAll(this, outEvents, evt);
      }
      this._active = p; // set new active item
      fireAll(this, overEvents, evt); // fire over for new active item
      fireAll(this, moveEvents, evt); // fire move for new active item
    }
  };
}

function inactive(types) {
  return function(evt) {
    fireAll(this, types, evt);
    this._active = null;
  };
}

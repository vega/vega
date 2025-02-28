import Handler from './Handler.js';
import {domFind} from './util/dom.js';
import {HrefEvent, TooltipHideEvent, TooltipShowEvent} from './util/events.js';

export default class SVGHandler extends Handler {
  constructor(loader, tooltip) {
    super(loader, tooltip);
    const h = this;
    h._hrefHandler = listener(h, (evt, item) => {
      if (item && item.href) h.handleHref(evt, item, item.href);
    });
    h._tooltipHandler = listener(h, (evt, item) => {
      h.handleTooltip(evt, item, evt.type !== TooltipHideEvent);
    });
  }

  initialize(el, origin, obj) {
    let svg = this._svg;
    if (svg) {
      svg.removeEventListener(HrefEvent, this._hrefHandler);
      svg.removeEventListener(TooltipShowEvent, this._tooltipHandler);
      svg.removeEventListener(TooltipHideEvent, this._tooltipHandler);
    }
    this._svg = svg = el && domFind(el, 'svg');
    if (svg) {
      svg.addEventListener(HrefEvent, this._hrefHandler);
      svg.addEventListener(TooltipShowEvent, this._tooltipHandler);
      svg.addEventListener(TooltipHideEvent, this._tooltipHandler);
    }
    return super.initialize(el, origin, obj);
  }

  canvas() {
    return this._svg;
  }

  // add an event handler
  on(type, handler) {
    const name = this.eventName(type),
          h = this._handlers,
          i = this._handlerIndex(h[name], type, handler);

    if (i < 0) {
      const x = {
        type,
        handler,
        listener: listener(this, handler)
      };

      (h[name] || (h[name] = [])).push(x);
      if (this._svg) {
        this._svg.addEventListener(name, x.listener);
      }
    }

    return this;
  }

  // remove an event handler
  off(type, handler) {
    const name = this.eventName(type),
          h = this._handlers[name],
          i = this._handlerIndex(h, type, handler);

    if (i >= 0) {
      if (this._svg) {
        this._svg.removeEventListener(name, h[i].listener);
      }
      h.splice(i, 1);
    }

    return this;
  }
}

// wrap an event listener for the SVG DOM
const listener = (context, handler) => evt => {
  let item = evt.target.__data__;
  item = Array.isArray(item) ? item[0] : item;
  evt.vegaType = evt.type;
  handler.call(context._obj, evt, item);
};

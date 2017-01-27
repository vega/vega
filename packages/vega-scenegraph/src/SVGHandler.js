import Handler from './Handler';
import {domFind} from './util/dom';
import {inherits} from 'vega-util';

export default function SVGHandler(loader) {
  Handler.call(this, loader);
  var h = this;
  h._hrefHandler = listener(h, function(evt, item) {
    if (item && item.href) h.handleHref(evt, item, item.href);
  });
  h._tooltipHandler = listener(h, function(evt, item) {
    if (item && item.tooltip) {
      h.handleTooltip(evt, item, evt.type === 'mouseover' ? item.tooltip : null);
    }
  });
}

var prototype = inherits(SVGHandler, Handler);

prototype.initialize = function(el, origin, obj) {
  var svg = this._svg;
  if (svg) {
    svg.removeEventListener('click', this._hrefHandler);
    svg.removeEventListener('mouseover', this._tooltipHandler);
    svg.removeEventListener('mouseout', this._tooltipHandler);
  }
  this._svg = svg = el && domFind(el, 'svg');
  if (svg) {
    svg.addEventListener('click', this._hrefHandler);
    svg.addEventListener('mouseover', this._tooltipHandler);
    svg.addEventListener('mouseout', this._tooltipHandler);
  }
  return Handler.prototype.initialize.call(this, el, origin, obj);
};

prototype.svg = function() {
  return this._svg;
};

// wrap an event listener for the SVG DOM
function listener(context, handler) {
  return function(evt) {
    var target = evt.target,
        item = target.__data__;
    evt.vegaType = evt.type;
    item = Array.isArray(item) ? item[0] : item;
    handler.call(context._obj, evt, item);
  };
}

// add an event handler
prototype.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers,
      x = {
        type:     type,
        handler:  handler,
        listener: listener(this, handler)
      };

  (h[name] || (h[name] = [])).push(x);

  if (this._svg) {
    this._svg.addEventListener(name, x.listener);
  }

  return this;
};

// remove an event handler
prototype.off = function(type, handler) {
  var name = this.eventName(type),
      svg = this._svg,
      h = this._handlers[name], i;

  if (!h) return;

  for (i=h.length; --i>=0;) {
    if (h[i].type === type && !handler || h[i].handler === handler) {
      if (this._svg) {
        svg.removeEventListener(name, h[i].listener);
      }
      h.splice(i, 1);
    }
  }

  return this;
};

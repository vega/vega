var DOM = require('../../util/dom'),
    Handler = require('../Handler');

function SVGHandler() {
  Handler.call(this);
}

var base = Handler.prototype;
var prototype = (SVGHandler.prototype = Object.create(base));
prototype.constructor = SVGHandler;

prototype.initialize = function(el, pad, obj) {
  this._svg = DOM.find(el, 'svg');
  return base.initialize.call(this, el, pad, obj);
};

prototype.svg = function() {
  return this._svg;
};

// wrap an event listener for the SVG DOM
prototype.listener = function(handler) {
  var that = this;
  return function(evt) {
    var target = evt.target,
        item = target.__data__;
    evt.vegaType = evt.type;
    item = Array.isArray(item) ? item[0] : item;
    handler.call(that._obj, evt, item);
  };
};

// add an event handler
prototype.on = function(type, handler) {
  var name = this.eventName(type),
      svg = this._svg,
      h = this._handlers,
      x = {
        type:     type,
        handler:  handler,
        listener: this.listener(handler)
      };

  (h[name] || (h[name] = [])).push(x);
  svg.addEventListener(name, x.listener);
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
      svg.removeEventListener(name, h[i].listener);
      h.splice(i, 1);
    }
  }
  return this;
};

module.exports = SVGHandler;

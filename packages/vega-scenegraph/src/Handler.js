import {domCreate} from './util/dom';
import {loader} from 'vega-loader';

export default function Handler(customLoader) {
  this._active = null;
  this._handlers = {};
  this._loader = customLoader || loader();
}

var prototype = Handler.prototype;

prototype.initialize = function(el, origin, obj) {
  this._el = el;
  this._obj = obj || null;
  return this.origin(origin);
};

prototype.element = function() {
  return this._el;
};

prototype.origin = function(origin) {
  this._origin = origin || [0, 0];
  return this;
};

prototype.scene = function(scene) {
  if (!arguments.length) return this._scene;
  this._scene = scene;
  return this;
};

// add an event handler
// subclasses should override
prototype.on = function(/*type, handler*/) {};

// remove an event handler
// subclasses should override
prototype.off = function(/*type, handler*/) {};

// return an array with all registered event handlers
prototype.handlers = function() {
  var h = this._handlers, a = [], k;
  for (k in h) { a.push.apply(a, h[k]); }
  return a;
};

prototype.eventName = function(name) {
  var i = name.indexOf('.');
  return i < 0 ? name : name.slice(0,i);
};

prototype.handleHref = function(event, item, href) {
  this._loader
    .sanitize(href, {context:'href'})
    .then(function(opt) {
      var e = new MouseEvent(event.type, event),
          a = domCreate(null, 'a');
      for (var name in opt) a.setAttribute(name, opt[name]);
      a.dispatchEvent(e);
    })
    .catch(function() { /* do nothing */ });
};

prototype.handleTooltip = function(event, item, tooltipText) {
  this._el.setAttribute('title', tooltipText || '');
};

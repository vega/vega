var dl = require('datalib');

function Handler() {
  this._active = null;
  this._handlers = {};
}

var prototype = Handler.prototype;

prototype.initialize = function(el, pad, obj) {
  this._el = el;
  this._obj = obj || null;
  return this.padding(pad);
};

prototype.element = function() {
  return this._el;
};

prototype.padding = function(pad) {
  this._padding = pad || {top:0, left:0, bottom:0, right:0};
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
  var h = this._handlers;
  return dl.keys(h).reduce(function(a, k) {
    return h[k].reduce(function(a, x) { return (a.push(x), a); }, a);
  }, []);
};

prototype.eventName = function(name) {
  var i = name.indexOf(".");
  return i < 0 ? name : name.slice(0,i);
};

module.exports = Handler;
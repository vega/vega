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

module.exports = Handler;
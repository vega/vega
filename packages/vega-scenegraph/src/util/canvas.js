function instance(w, h) {
  w = w || 1;
  h = h || 1;
  var canvas;

  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  } else {
    var Canvas = require('canvas');
    if (!Canvas.prototype) return null;
    canvas = new Canvas(w, h);
  }
  return lineDash(canvas);
}

function resize(canvas, w, h, p, retina) {
  var g = this._ctx = canvas.getContext('2d'), 
      s = 1;

  canvas.width = w + p.left + p.right;
  canvas.height = h + p.top + p.bottom;

  // if browser canvas, attempt to modify for retina display
  if (retina && typeof HTMLElement !== 'undefined' &&
      canvas instanceof HTMLElement)
  {
    g.pixelratio = (s = pixelRatio(canvas) || 1);
  }

  g.setTransform(s, 0, 0, s, s*p.left, s*p.top);
  return canvas;
}

function pixelRatio(canvas) {
  var g = canvas.getContext('2d');

  // get canvas pixel data
  var devicePixelRatio = window && window.devicePixelRatio || 1,
      backingStoreRatio = (
        g.webkitBackingStorePixelRatio ||
        g.mozBackingStorePixelRatio ||
        g.msBackingStorePixelRatio ||
        g.oBackingStorePixelRatio ||
        g.backingStorePixelRatio) || 1,
      ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    // set actual and visible canvas size
    var w = canvas.width,
        h = canvas.height;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  return ratio;
}

function lineDash(canvas) {
  var g = canvas.getContext('2d');
  if (g.vgLineDash) return; // already initialized!

  var NOOP = function() {},
      NODASH = [];
  
  if (g.setLineDash) {
    g.vgLineDash = function(dash) { this.setLineDash(dash || NODASH); };
    g.vgLineDashOffset = function(off) { this.lineDashOffset = off; };
  } else if (g.webkitLineDash !== undefined) {
  	g.vgLineDash = function(dash) { this.webkitLineDash = dash || NODASH; };
    g.vgLineDashOffset = function(off) { this.webkitLineDashOffset = off; };
  } else if (g.mozDash !== undefined) {
    g.vgLineDash = function(dash) { this.mozDash = dash; };
    g.vgLineDashOffset = NOOP;
  } else {
    g.vgLineDash = NOOP;
    g.vgLineDashOffset = NOOP;
  }
  return canvas;
}

module.exports = {
  instance:   instance,
  resize:     resize,
  lineDash:   lineDash
};

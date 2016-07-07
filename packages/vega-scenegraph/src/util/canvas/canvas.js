export var Canvas;

try { Canvas = require('canvas'); } catch (e) { Canvas = null; }

export default function(w, h) {
  var canvas = null;
  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  } else if (Canvas) {
    canvas = new Canvas(w, h);
  }
  return canvas;
}

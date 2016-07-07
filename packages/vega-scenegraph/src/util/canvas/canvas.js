import Canvas from 'canvas';

export default function(w, h) {
  var canvas = null;
  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  } else if (Canvas && Canvas.prototype) {
    canvas = new Canvas(w, h);
  }
  return canvas;
}

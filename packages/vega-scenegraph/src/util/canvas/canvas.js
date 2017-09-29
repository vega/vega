import {domCreate} from '../dom';

export var Canvas;

try {
  Canvas = require('canvas');
  Canvas = Canvas || require('canvas-prebuilt');
} catch (e) { Canvas = null; }

export default function(w, h) {
  var canvas = domCreate(null, 'canvas');
  if (canvas && canvas.getContext) {
    canvas.width = w;
    canvas.height = h;
  } else if (Canvas) {
    try {
      canvas = new Canvas(w, h);
    } catch (e) {
      canvas = null;
    }
  }
  return canvas;
}

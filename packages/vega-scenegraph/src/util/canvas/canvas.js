import {domCreate} from '../dom';

export var Canvas;

try {
  // try to load canvas module
  Canvas = require('canvas');
} catch (e) {
  try {
    // if canvas fails, try to load canvas-prebuilt
    Canvas = require('canvas-prebuilt');
  } catch (e2) {
    // if all options fail, set to null
    Canvas = null;
  }
}

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

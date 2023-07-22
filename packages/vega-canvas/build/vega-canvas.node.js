(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega = {}));
})(this, (function (exports) { 'use strict';

  function domCanvas(w, h) {
    if (typeof document !== 'undefined' && document.createElement) {
      const c = document.createElement('canvas');
      if (c && c.getContext) {
        c.width = w;
        c.height = h;
        return c;
      }
    }
    return null;
  }
  const domImage = () => typeof Image !== 'undefined' ? Image : null;

  let NodeCanvas;
  try {
    NodeCanvas = require('canvas');
    if (!(NodeCanvas && NodeCanvas.createCanvas)) {
      NodeCanvas = null;
    }
  } catch (error) {
    // do nothing
  }
  function nodeCanvas(w, h, type) {
    if (NodeCanvas) {
      try {
        return new NodeCanvas.Canvas(w, h, type);
      } catch (e) {
        // do nothing, return null on error
      }
    }
    return null;
  }
  const nodeImage = () => NodeCanvas && NodeCanvas.Image || null;

  function canvas(w, h, type) {
    return domCanvas(w, h) || nodeCanvas(w, h, type) || null;
  }
  function image() {
    return domImage() || nodeImage() || null;
  }

  exports.canvas = canvas;
  exports.domCanvas = domCanvas;
  exports.image = image;
  exports.nodeCanvas = nodeCanvas;

}));

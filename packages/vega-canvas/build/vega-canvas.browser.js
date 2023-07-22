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

  exports.canvas = domCanvas;
  exports.domCanvas = domCanvas;
  exports.image = domImage;

}));

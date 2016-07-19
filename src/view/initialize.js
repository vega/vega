import initializeRenderer from './initialize-renderer';
import initializeHandler from './initialize-handler';
import {SVG} from './render-types';

import {
  CanvasRenderer,
  CanvasHandler,
  SVGRenderer,
  SVGHandler,
  SVGStringRenderer
} from 'vega-scenegraph';

export default function(el) {
  var view = this;

  // containing dom element
  if (el) {
    if (typeof el === 'string' && typeof document !== 'undefined') {
      el = document.querySelector(el);
    }
    el.innerHTML = ''; // clear
    view._el = el;
  } else {
    view._el = null; // headless
  }

  // renderer and input handler
  var io = getIO(view._renderType, el);
  view._renderer = initializeRenderer(view, view._renderer, el, io.Renderer);
  view._handler = initializeHandler(view, view._handler, el, io.Handler);

  return view;
}

function getIO(type, el) {
  var r = CanvasRenderer,
      h = CanvasHandler;
  if (type === SVG) {
    r = el ? SVGRenderer : SVGStringRenderer;
    h = SVGHandler;
  }
  return {Renderer: r, Handler: h};
}

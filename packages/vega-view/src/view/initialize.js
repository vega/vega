import initializeRenderer from './initialize-renderer';
import initializeHandler from './initialize-handler';
import {None, SVG} from './render-types';

import {
  CanvasRenderer,
  CanvasHandler,
  SVGRenderer,
  SVGHandler,
  SVGStringRenderer
} from 'vega-scenegraph';

export default function(el) {
  var view = this,
      type = view._renderType,
      Handler = CanvasHandler,
      Renderer = CanvasRenderer;

  // select appropriate renderer/handler types
  if (type === SVG) {
    Handler = SVGHandler;
    Renderer = (el ? SVGRenderer : SVGStringRenderer);
  }

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

  // initialize renderer and input handler
  view._renderer = (type === None) ? null
    : initializeRenderer(view, view._renderer, el, Renderer);
  view._handler = initializeHandler(view, view._handler, el, Handler);

  // initialize view bindings
  if (el && view._bind) view._bind.forEach(function(binding) {
    view.bind(binding.element || el, binding);
  });

  return view;
}

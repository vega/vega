import bind from './bind';
import initializeRenderer from './initialize-renderer';
import initializeHandler from './initialize-handler';
import {rendererModule} from './render-types';
import {CanvasHandler} from 'vega-scenegraph';

export default function(el) {
  var view = this,
      type = view._renderType,
      module = rendererModule(type),
      Handler, Renderer;

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

  // select appropriate renderer & handler
  if (!module) view.error('Unrecognized renderer type: ' + type);
  Handler = module.handler || CanvasHandler;
  Renderer = (view._el ? module.renderer : module.headless);

  // initialize renderer and input handler
  view._renderer = !Renderer ? null
    : initializeRenderer(view, view._renderer, el, Renderer);
  view._handler = initializeHandler(view, view._handler, el, Handler);

  // initialize view bindings
  if (el) view._bind.forEach(function(_) {
    bind(view, _.param.element || el, _);
  });

  return view;
}

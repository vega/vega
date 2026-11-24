import {initializeAria} from './aria.js';
import bind from './bind.js';
import element from './element.js';
import initializeRenderer from './initialize-renderer.js';
import initializeHandler from './initialize-handler.js';
import observeContainer from './observeContainer.js';
import {isOffscreenCanvas} from 'vega-canvas';
import {CanvasHandler, RenderType, renderModule} from 'vega-scenegraph';
import {error} from 'vega-util';

export default function(el, elBind) {
  const view = this,
        type = view._renderType,
        config = view._eventConfig.bind,
        module = renderModule(type);

  // containing dom element
  el = view._el = el ? lookup(view, el, true) : null;

  // the canvas option only works with the canvas renderer, and an
  // OffscreenCanvas can not be displayed by a container element --
  // fail loudly rather than silently rendering nowhere
  if (view.canvas) {
    if (type !== RenderType.Canvas) {
      error('The canvas option requires the canvas renderer, not: ' + type);
    }
    if (el && isOffscreenCanvas(view.canvas)) {
      error('An OffscreenCanvas can not be used with a container element.');
    }
  }

  // initialize aria attributes
  initializeAria(view);

  // select appropriate renderer & handler
  if (!module) view.error('Unrecognized renderer type: ' + type);
  const Handler = module.handler || CanvasHandler,
        Renderer = (el ? module.renderer : module.headless);

  // initialize renderer and input handler
  view._renderer = !Renderer ? null
    : initializeRenderer(view, view._renderer, el, Renderer, undefined,
        view.canvas ? {canvas: view.canvas} : undefined);
  view._handler = initializeHandler(view, view._handler, el, Handler);
  view._redraw = true;

  // initialize signal bindings
  if (el && config !== 'none') {
    elBind = elBind ? (view._elBind = lookup(view, elBind, true))
      : el.appendChild(element('form', {'class': 'vega-bindings'}));

    view._bind.forEach(_ => {
      if (_.param.element && config !== 'container') {
        _.element = lookup(view, _.param.element, !!_.param.input);
      }
    });

    view._bind.forEach(_ => {
      bind(view, _.element || elBind, _);
    });
  }

  observeContainer(view);

  return view;
}

function lookup(view, el, clear) {
  if (typeof el === 'string') {
    if (typeof document !== 'undefined') {
      el = document.querySelector(el);
      if (!el) {
        view.error('Signal bind element not found: ' + el);
        return null;
      }
    } else {
      view.error('DOM document instance not found.');
      return null;
    }
  }
  if (el && clear) {
    try {
      el.textContent = '';
    } catch (e) {
      el = null;
      view.error(e);
    }
  }
  return el;
}

import {offset} from './render-size.js';
import trap from './trap.js';

export default function(view, prevHandler, el, constructor) {
  // instantiate scenegraph handler
  const handler = new constructor(view.loader(), trap(view, view.tooltip()))
    .scene(view.scenegraph().root)
    .initialize(el, offset(view), view);

  // transfer event handlers
  if (prevHandler) {
    prevHandler.handlers().forEach(h => {
      handler.on(h.type, h.handler);
    });
  }

  return handler;
}

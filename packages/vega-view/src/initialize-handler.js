import {offset} from './render-size';

export default function(view, prevHandler, el, constructor) {
  var handler = new constructor()
    .scene(view.scenegraph().root)
    .initialize(el, offset(view), view);

  if (prevHandler) {
    handler.handleTooltip = prevHandler.handleTooltip;
    prevHandler.handlers().forEach(function(h) {
      handler.on(h.type, h.handler);
    });
  }

  return handler;
}

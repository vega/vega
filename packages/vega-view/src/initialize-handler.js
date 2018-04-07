import {offset} from './render-size';

export default function(view, prevHandler, el, constructor) {
  var handler = new constructor(view.loader(), view.tooltip())
    .scene(view.scenegraph().root)
    .initialize(el, offset(view), view);

  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      handler.on(h.type, h.handler);
    });
  }

  return handler;
}

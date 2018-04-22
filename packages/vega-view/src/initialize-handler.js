import {offset} from './render-size';

export default function(view, prevHandler, el, constructor) {
  var handler = new constructor(view.loader(), tooltip(view))
    .scene(view.scenegraph().root)
    .initialize(el, offset(view), view);

  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      handler.on(h.type, h.handler);
    });
  }

  return handler;
}

// wrap tooltip handler to trap errors
function tooltip(view) {
  var handler = view.tooltip(),
      tooltip = null;

  if (handler) {
    tooltip = function() {
      try {
        handler.apply(this, arguments);
      } catch (error) {
        view.error(error);
      }
    };
  }

  return tooltip;
}

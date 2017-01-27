import eventExtend from './events-extend';
import {EventStream} from 'vega-dataflow';

var VIEW = 'view',
    WINDOW = 'window';

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @return {EventStream}
 */
export default function(source, type, filter) {
  var view = this,
      s = new EventStream(filter),
      send = function(e, item) {
        if (view.preventDefault() && source === VIEW) {
          e.preventDefault();
        }
        s.receive(eventExtend(view, e, item));
        view.run();
      },
      sources;

  if (source === VIEW) {
    view.addEventListener(type, send);
    return s;
  }

  if (source === WINDOW) {
    if (typeof window !== 'undefined') sources = [window];
  } else if (typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  }

  if (!sources) {
    view.warn('Can not resolve event source: ' + source);
    return s;
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  view._eventListeners.push({
    type:    type,
    sources: sources,
    handler: send
  });

  return s;
}

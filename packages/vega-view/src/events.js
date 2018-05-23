import eventExtend from './events-extend';
import {EventStream} from 'vega-dataflow';
import {extend, isArray, toSet} from 'vega-util';

var VIEW = 'view',
    TIMER = 'timer',
    WINDOW = 'window',
    NO_TRAP = {trap: false};

/**
 * Initialize event handling configuration.
 * @param {object} config - The configuration settings.
 * @return {object}
 */
export function initializeEventConfig(config) {
  config = extend({}, config);

  var def = config.defaults;
  if (def) {
    if (isArray(def.prevent)) {
      def.prevent = toSet(def.prevent);
    }
    if (isArray(def.allow)) {
      def.allow = toSet(def.allow);
    }
  }

  return config;
}

function prevent(view, type) {
  var def = view._eventConfig.defaults,
      prevent = def && def.prevent,
      allow = def && def.allow;

  return prevent === false || allow === true ? false
    : prevent === true || allow === false ? true
    : prevent ? prevent[type]
    : allow ? !allow[type]
    : view.preventDefault();
}

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @return {EventStream}
 */
export function events(source, type, filter) {
  var view = this,
      s = new EventStream(filter),
      send = function(e, item) {
        if (source === VIEW && prevent(view, type)) {
          e.preventDefault();
        }
        try {
          s.receive(eventExtend(view, e, item));
        } catch (error) {
          view.error(error);
        } finally {
          view.run();
        }
      },
      sources;

  if (source === TIMER) {
    view.timer(send, type);
  }

  else if (source === VIEW) {
    // send traps errors, so use {trap: false} option
    view.addEventListener(type, send, NO_TRAP);
  }

  else {
    if (source === WINDOW) {
      if (typeof window !== 'undefined') sources = [window];
    } else if (typeof document !== 'undefined') {
      sources = document.querySelectorAll(source);
    }

    if (!sources) {
      view.warn('Can not resolve event source: ' + source);
    } else {
      for (var i=0, n=sources.length; i<n; ++i) {
        sources[i].addEventListener(type, send);
      }

      view._eventListeners.push({
        type:    type,
        sources: sources,
        handler: send
      });
    }
  }

  return s;
}

import eventExtend from './events-extend';
import {EventStream} from 'vega-dataflow';
import {extend, isArray, isObject, toSet} from 'vega-util';

const VIEW = 'view';
const TIMER = 'timer';
const WINDOW = 'window';
const NO_TRAP = {trap: false};

/**
 * Initialize event handling configuration.
 * @param {object} config - The configuration settings.
 * @return {object}
 */
export function initializeEventConfig(config) {
  const events = extend({defaults: {}}, config);

  const unpack = (obj, keys) => {
    keys.forEach(k => {
      if (isArray(obj[k])) obj[k] = toSet(obj[k]);
    });
  };

  unpack(events.defaults, ['prevent', 'allow']);
  unpack(events, ['view', 'window', 'selector']);

  return events;
}

function prevent(view, type) {
  const def = view._eventConfig.defaults;
  const prevent = def.prevent;
  const allow = def.allow;

  return prevent === false || allow === true
    ? false
    : prevent === true || allow === false
    ? true
    : prevent
    ? prevent[type]
    : allow
    ? !allow[type]
    : view.preventDefault();
}

function permit(view, key, type) {
  const rule = view._eventConfig && view._eventConfig[key];

  if (rule === false || (isObject(rule) && !rule[type])) {
    view.warn(`Blocked ${key} ${type} event listener.`);
    return false;
  }

  return true;
}

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @return {EventStream}
 */
export function events(source, type, filter) {
  const view = this;
  const s = new EventStream(filter);
  const send = function (e, item) {
    view.runAsync(null, () => {
      if (source === VIEW && prevent(view, type)) {
        e.preventDefault();
      }
      s.receive(eventExtend(view, e, item));
    });
  };
  let sources;

  if (source === TIMER) {
    if (permit(view, 'timer', type)) {
      view.timer(send, type);
    }
  } else if (source === VIEW) {
    if (permit(view, 'view', type)) {
      // send traps errors, so use {trap: false} option
      view.addEventListener(type, send, NO_TRAP);
    }
  } else {
    if (source === WINDOW) {
      if (permit(view, 'window', type) && typeof window !== 'undefined') {
        sources = [window];
      }
    } else if (typeof document !== 'undefined') {
      if (permit(view, 'selector', type)) {
        sources = document.querySelectorAll(source);
      }
    }

    if (!sources) {
      view.warn('Can not resolve event source: ' + source);
    } else {
      for (let i = 0, n = sources.length; i < n; ++i) {
        sources[i].addEventListener(type, send);
      }

      view._eventListeners.push({
        type: type,
        sources: sources,
        handler: send
      });
    }
  }

  return s;
}

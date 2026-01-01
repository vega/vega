import eventExtend from './events-extend.js';
import {EventStream} from 'vega-dataflow';
import {array, extend, isArray, isObject, toSet} from 'vega-util';

const VIEW = 'view',
      TIMER = 'timer',
      WINDOW = 'window',
      NO_TRAP = {trap: false};

/**
 * Properties hidden from DOM events when accessed through Vega expressions.
 *
 * These properties are removed because they are not part of the standard DOM event
 * interface needed by the Vega grammar.
 *
 * Standard DOM event properties (metaKey, key, buttons, target, etc.) remain available.
 */
const HIDDEN_EVENT_PROPS = new Set([
        'view',
        'path',
        'srcElement',
        'sourceEvent',
        'originalTarget']),
      HIDDEN_TARGET_PROPS = new Set([
        ...HIDDEN_EVENT_PROPS,
        'ownerDocument',
        'defaultView'
      ]);

/**
 * Cache proxy wrappers for DOM nodes to:
 * 1. Prevent infinite recursion when traversing circular DOM references
 *    (e.g., node.parentNode.firstChild might reference back to node)
 * 2. Preserve object identity so the same DOM node accessed through different
 *    paths returns the same proxy instance (maintains === equality)
 * Uses WeakMap so entries are automatically garbage collected when the
 * underlying DOM nodes are no longer referenced, preventing memory leaks.
 */
const targetProxyCache = typeof WeakMap === 'function' ? new WeakMap() : null;

/**
 * Wrap the incoming DOM event so downstream expressions see only vetted data.
 * The proxy hides explicitly blocklisted properties and recursively wraps any
 * DOM nodes that appear on the event (e.g., target, currentTarget, etc.).
 */
function sanitizeEvent(event) {
  if (!event) return event;
  const hide = prop => HIDDEN_EVENT_PROPS.has(prop);
  return new Proxy(event, {
    get(target, prop, receiver) {
      if (hide(prop)) return undefined;
      if (prop === 'composedPath' || prop === 'deepPath') {
        return () => [];
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return shouldWrap(value) ? wrapTarget(value) : value;
    },
    has(target, prop) {
      return hide(prop) ? false : prop in target;
    },
    getOwnPropertyDescriptor(target, prop) {
      return hide(prop)
        ? undefined
        : Object.getOwnPropertyDescriptor(target, prop);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(key => !hide(key));
    }
  });
}

/**
 * Recursively wrap DOM nodes so sensitive properties (ownerDocument, etc.)
 * remain hidden even when expressions traverse through target.parentNode,
 * relatedTarget, and similar relationships.
 */
function wrapTarget(target) {
  if (!shouldWrap(target)) return target;
  if (targetProxyCache && targetProxyCache.has(target)) {
    return targetProxyCache.get(target);
  }

  const hide = prop => HIDDEN_TARGET_PROPS.has(prop);
  const proxy = new Proxy(target, {
    get(t, prop, receiver) {
      if (hide(prop)) return undefined;
      const value = Reflect.get(t, prop, receiver);
      if (typeof value === 'function') return value.bind(t);
      return shouldWrap(value) ? wrapTarget(value) : value;
    },
    has(t, prop) {
      return hide(prop) ? false : prop in t;
    },
    getOwnPropertyDescriptor(t, prop) {
      return hide(prop)
        ? undefined
        : Object.getOwnPropertyDescriptor(t, prop);
    },
    ownKeys(t) {
      return Reflect.ownKeys(t).filter(key => !hide(key));
    }
  });

  if (targetProxyCache) targetProxyCache.set(target, proxy);
  return proxy;
}

/**
 * Detect DOM nodes using duck-typing rather than instanceof Node.
 * Uses duck-typing because instanceof Node fails in jsdom test environments
 * where nodes come from a separate Node class hierarchy. Also handles
 * detached nodes (created but not appended to the DOM).
 * Checks multiple properties to minimize false positives with plain objects.
 */
function shouldWrap(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.ownerDocument !== undefined
      || value.defaultView !== undefined
      || value.parentNode !== undefined
      || value.parentElement !== undefined
      || value.nodeType !== undefined) {
    return true;
  }
  return false;
}

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

export function trackEventListener(view, sources, type, handler) {
  view._eventListeners.push({
    type: type,
    sources: array(sources),
    handler: handler
  });
}

function prevent(view, type) {
  var def = view._eventConfig.defaults,
      prevent = def.prevent,
      allow = def.allow;

  return prevent === false || allow === true ? false
    : prevent === true || allow === false ? true
    : prevent ? prevent[type]
    : allow ? !allow[type]
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
  var view = this,
      s = new EventStream(filter),
      send = function(e, item) {
        view.runAsync(null, () => {
          if (source === VIEW && prevent(view, type)) {
            e.preventDefault();
          }
          s.receive(eventExtend(view, sanitizeEvent(e), item));
        });
      },
      sources;

  if (source === TIMER) {
    if (permit(view, 'timer', type)) {
      view.timer(send, type);
    }
  }

  else if (source === VIEW) {
    if (permit(view, 'view', type)) {
      // send traps errors, so use {trap: false} option
      view.addEventListener(type, send, NO_TRAP);
    }
  }

  else {
    if (source === WINDOW) {
      if (permit(view, 'window', type) && typeof window !== 'undefined') {
        sources = [window];
      }
    } else if (typeof document !== 'undefined') {
      if (permit(view, 'selector', type)) {
        sources = Array.from(document.querySelectorAll(source));
      }
    }

    if (!sources) {
      view.warn('Can not resolve event source: ' + source);
    } else {
      for (var i=0, n=sources.length; i<n; ++i) {
        sources[i].addEventListener(type, send);
      }
      trackEventListener(view, sources, type, send);
    }
  }

  return s;
}

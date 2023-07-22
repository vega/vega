import { isString, hasOwnProperty, error, truthy, constant, extend, array, isObject, isArray, toSet, debounce, isDate, inherits, stringValue } from 'vega-util';
import { changeset, isChangeSet, EventStream, transforms, Dataflow, asyncCallback } from 'vega-dataflow';
import { point, renderModule, CanvasHandler, RenderType, Scenegraph } from 'vega-scenegraph';
import { tickStep } from 'd3-array';
import { functionContext } from 'vega-functions';
import { context } from 'vega-runtime';
import { interval } from 'd3-timer';
import { locale } from 'vega-format';

// initialize aria role and label attributes
function initializeAria(view) {
  const el = view.container();
  if (el) {
    el.setAttribute('role', 'graphics-document');
    el.setAttribute('aria-roleDescription', 'visualization');
    ariaLabel(el, view.description());
  }
}

// update aria-label if we have a DOM container element
function ariaLabel(el, desc) {
  if (el) desc == null ? el.removeAttribute('aria-label') : el.setAttribute('aria-label', desc);
}

function background (view) {
  // respond to background signal
  view.add(null, _ => {
    view._background = _.bg;
    view._resize = 1;
    return _.bg;
  }, {
    bg: view._signals.background
  });
}

const Default = 'default';
function cursor (view) {
  // get cursor signal, add to dataflow if needed
  const cursor = view._signals.cursor || (view._signals.cursor = view.add({
    user: Default,
    item: null
  }));

  // evaluate cursor on each mousemove event
  view.on(view.events('view', 'mousemove'), cursor, (_, event) => {
    const value = cursor.value,
      user = value ? isString(value) ? value : value.user : Default,
      item = event.item && event.item.cursor || null;
    return value && user === value.user && item == value.item ? value : {
      user: user,
      item: item
    };
  });

  // when cursor signal updates, set visible cursor
  view.add(null, function (_) {
    let user = _.cursor,
      item = this.value;
    if (!isString(user)) {
      item = user.item;
      user = user.user;
    }
    setCursor(view, user && user !== Default ? user : item || user);
    return item;
  }, {
    cursor: cursor
  });
}
function setCursor(view, cursor) {
  const el = view.globalCursor() ? typeof document !== 'undefined' && document.body : view.container();
  if (el) {
    return cursor == null ? el.style.removeProperty('cursor') : el.style.cursor = cursor;
  }
}

function dataref(view, name) {
  var data = view._runtime.data;
  if (!hasOwnProperty(data, name)) {
    error('Unrecognized data set: ' + name);
  }
  return data[name];
}
function data(name, values) {
  return arguments.length < 2 ? dataref(this, name).values.value : change.call(this, name, changeset().remove(truthy).insert(values));
}
function change(name, changes) {
  if (!isChangeSet(changes)) {
    error('Second argument to changes must be a changeset.');
  }
  const dataset = dataref(this, name);
  dataset.modified = true;
  return this.pulse(dataset.input, changes);
}
function insert(name, _) {
  return change.call(this, name, changeset().insert(_));
}
function remove(name, _) {
  return change.call(this, name, changeset().remove(_));
}

function width(view) {
  var padding = view.padding();
  return Math.max(0, view._viewWidth + padding.left + padding.right);
}
function height(view) {
  var padding = view.padding();
  return Math.max(0, view._viewHeight + padding.top + padding.bottom);
}
function offset(view) {
  var padding = view.padding(),
    origin = view._origin;
  return [padding.left + origin[0], padding.top + origin[1]];
}
function resizeRenderer(view) {
  var origin = offset(view),
    w = width(view),
    h = height(view);
  view._renderer.background(view.background());
  view._renderer.resize(w, h, origin);
  view._handler.origin(origin);
  view._resizeListeners.forEach(handler => {
    try {
      handler(w, h);
    } catch (error) {
      view.error(error);
    }
  });
}

/**
 * Extend an event with additional view-specific methods.
 * Adds a new property ('vega') to an event that provides a number
 * of methods for querying information about the current interaction.
 * The vega object provides the following methods:
 *   view - Returns the backing View instance.
 *   item - Returns the currently active scenegraph item (if any).
 *   group - Returns the currently active scenegraph group (if any).
 *     This method accepts a single string-typed argument indicating the name
 *     of the desired parent group. The scenegraph will be traversed from
 *     the item up towards the root to search for a matching group. If no
 *     argument is provided the enclosing group for the active item is
 *     returned, unless the item it itself a group, in which case it is
 *     returned directly.
 *   xy - Returns a two-element array containing the x and y coordinates for
 *     mouse or touch events. For touch events, this is based on the first
 *     elements in the changedTouches array. This method accepts a single
 *     argument: either an item instance or mark name that should serve as
 *     the reference coordinate system. If no argument is provided the
 *     top-level view coordinate system is assumed.
 *   x - Returns the current x-coordinate, accepts the same arguments as xy.
 *   y - Returns the current y-coordinate, accepts the same arguments as xy.
 * @param {Event} event - The input event to extend.
 * @param {Item} item - The currently active scenegraph item (if any).
 * @return {Event} - The extended input event.
 */
function eventExtend (view, event, item) {
  var r = view._renderer,
    el = r && r.canvas(),
    p,
    e,
    translate;
  if (el) {
    translate = offset(view);
    e = event.changedTouches ? event.changedTouches[0] : event;
    p = point(e, el);
    p[0] -= translate[0];
    p[1] -= translate[1];
  }
  event.dataflow = view;
  event.item = item;
  event.vega = extension(view, item, p);
  return event;
}
function extension(view, item, point) {
  const itemGroup = item ? item.mark.marktype === 'group' ? item : item.mark.group : null;
  function group(name) {
    var g = itemGroup,
      i;
    if (name) for (i = item; i; i = i.mark.group) {
      if (i.mark.name === name) {
        g = i;
        break;
      }
    }
    return g && g.mark && g.mark.interactive ? g : {};
  }
  function xy(item) {
    if (!item) return point;
    if (isString(item)) item = group(item);
    const p = point.slice();
    while (item) {
      p[0] -= item.x || 0;
      p[1] -= item.y || 0;
      item = item.mark && item.mark.group;
    }
    return p;
  }
  return {
    view: constant(view),
    item: constant(item || {}),
    group: group,
    xy: xy,
    x: item => xy(item)[0],
    y: item => xy(item)[1]
  };
}

const VIEW = 'view',
  TIMER = 'timer',
  WINDOW = 'window',
  NO_TRAP = {
    trap: false
  };

/**
 * Initialize event handling configuration.
 * @param {object} config - The configuration settings.
 * @return {object}
 */
function initializeEventConfig(config) {
  const events = extend({
    defaults: {}
  }, config);
  const unpack = (obj, keys) => {
    keys.forEach(k => {
      if (isArray(obj[k])) obj[k] = toSet(obj[k]);
    });
  };
  unpack(events.defaults, ['prevent', 'allow']);
  unpack(events, ['view', 'window', 'selector']);
  return events;
}
function trackEventListener(view, sources, type, handler) {
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
  return prevent === false || allow === true ? false : prevent === true || allow === false ? true : prevent ? prevent[type] : allow ? !allow[type] : view.preventDefault();
}
function permit(view, key, type) {
  const rule = view._eventConfig && view._eventConfig[key];
  if (rule === false || isObject(rule) && !rule[type]) {
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
function events(source, type, filter) {
  var view = this,
    s = new EventStream(filter),
    send = function (e, item) {
      view.runAsync(null, () => {
        if (source === VIEW && prevent(view, type)) {
          e.preventDefault();
        }
        s.receive(eventExtend(view, e, item));
      });
    },
    sources;
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
        sources = Array.from(document.querySelectorAll(source));
      }
    }
    if (!sources) {
      view.warn('Can not resolve event source: ' + source);
    } else {
      for (var i = 0, n = sources.length; i < n; ++i) {
        sources[i].addEventListener(type, send);
      }
      trackEventListener(view, sources, type, send);
    }
  }
  return s;
}

function itemFilter(event) {
  return event.item;
}
function markTarget(event) {
  // grab upstream collector feeding the mark operator
  return event.item.mark.source;
}
function invoke(name) {
  return function (_, event) {
    return event.vega.view().changeset().encode(event.item, name);
  };
}
function hover (hoverSet, leaveSet) {
  hoverSet = [hoverSet || 'hover'];
  leaveSet = [leaveSet || 'update', hoverSet[0]];

  // invoke hover set upon mouseover
  this.on(this.events('view', 'mouseover', itemFilter), markTarget, invoke(hoverSet));

  // invoke leave set upon mouseout
  this.on(this.events('view', 'mouseout', itemFilter), markTarget, invoke(leaveSet));
  return this;
}

/**
 * Finalize a View instance that is being removed.
 * Cancel any running timers.
 * Remove all external event listeners.
 * Remove any currently displayed tooltip.
 */
function finalize () {
  var tooltip = this._tooltip,
    timers = this._timers,
    listeners = this._eventListeners,
    n,
    m,
    e;
  n = timers.length;
  while (--n >= 0) {
    timers[n].stop();
  }
  n = listeners.length;
  while (--n >= 0) {
    e = listeners[n];
    m = e.sources.length;
    while (--m >= 0) {
      e.sources[m].removeEventListener(e.type, e.handler);
    }
  }
  if (tooltip) {
    tooltip.call(this, this._handler, null, null, null);
  }
  return this;
}

function element (tag, attr, text) {
  const el = document.createElement(tag);
  for (const key in attr) el.setAttribute(key, attr[key]);
  if (text != null) el.textContent = text;
  return el;
}

const BindClass = 'vega-bind',
  NameClass = 'vega-bind-name',
  RadioClass = 'vega-bind-radio';

/**
 * Bind a signal to an external HTML input element. The resulting two-way
 * binding will propagate input changes to signals, and propagate signal
 * changes to the input element state. If this view instance has no parent
 * element, we assume the view is headless and no bindings are created.
 * @param {Element|string} el - The parent DOM element to which the input
 *   element should be appended as a child. If string-valued, this argument
 *   will be treated as a CSS selector. If null or undefined, the parent
 *   element of this view will be used as the element.
 * @param {object} param - The binding parameters which specify the signal
 *   to bind to, the input element type, and type-specific configuration.
 * @return {View} - This view instance.
 */
function bind (view, el, binding) {
  if (!el) return;
  const param = binding.param;
  let bind = binding.state;
  if (!bind) {
    bind = binding.state = {
      elements: null,
      active: false,
      set: null,
      update: value => {
        if (value != view.signal(param.signal)) {
          view.runAsync(null, () => {
            bind.source = true;
            view.signal(param.signal, value);
          });
        }
      }
    };
    if (param.debounce) {
      bind.update = debounce(param.debounce, bind.update);
    }
  }
  const create = param.input == null && param.element ? target : generate;
  create(bind, el, param, view);
  if (!bind.active) {
    view.on(view._signals[param.signal], null, () => {
      bind.source ? bind.source = false : bind.set(view.signal(param.signal));
    });
    bind.active = true;
  }
  return bind;
}

/**
 * Bind the signal to an external EventTarget.
 */
function target(bind, node, param, view) {
  const type = param.event || 'input';
  const handler = () => bind.update(node.value);

  // initialize signal value to external input value
  view.signal(param.signal, node.value);

  // listen for changes on the element
  node.addEventListener(type, handler);

  // register with view, so we can remove it upon finalization
  trackEventListener(view, node, type, handler);

  // propagate change to element
  bind.set = value => {
    node.value = value;
    node.dispatchEvent(event(type));
  };
}
function event(type) {
  return typeof Event !== 'undefined' ? new Event(type) : {
    type
  };
}

/**
 * Generate an HTML input form element and bind it to a signal.
 */
function generate(bind, el, param, view) {
  const value = view.signal(param.signal);
  const div = element('div', {
    'class': BindClass
  });
  const wrapper = param.input === 'radio' ? div : div.appendChild(element('label'));
  wrapper.appendChild(element('span', {
    'class': NameClass
  }, param.name || param.signal));
  el.appendChild(div);
  let input = form;
  switch (param.input) {
    case 'checkbox':
      input = checkbox;
      break;
    case 'select':
      input = select;
      break;
    case 'radio':
      input = radio;
      break;
    case 'range':
      input = range;
      break;
  }
  input(bind, wrapper, param, value);
}

/**
 * Generates an arbitrary input form element.
 * The input type is controlled via user-provided parameters.
 */
function form(bind, el, param, value) {
  const node = element('input');
  for (const key in param) {
    if (key !== 'signal' && key !== 'element') {
      node.setAttribute(key === 'input' ? 'type' : key, param[key]);
    }
  }
  node.setAttribute('name', param.signal);
  node.value = value;
  el.appendChild(node);
  node.addEventListener('input', () => bind.update(node.value));
  bind.elements = [node];
  bind.set = value => node.value = value;
}

/**
 * Generates a checkbox input element.
 */
function checkbox(bind, el, param, value) {
  const attr = {
    type: 'checkbox',
    name: param.signal
  };
  if (value) attr.checked = true;
  const node = element('input', attr);
  el.appendChild(node);
  node.addEventListener('change', () => bind.update(node.checked));
  bind.elements = [node];
  bind.set = value => node.checked = !!value || null;
}

/**
 * Generates a selection list input element.
 */
function select(bind, el, param, value) {
  const node = element('select', {
      name: param.signal
    }),
    labels = param.labels || [];
  param.options.forEach((option, i) => {
    const attr = {
      value: option
    };
    if (valuesEqual(option, value)) attr.selected = true;
    node.appendChild(element('option', attr, (labels[i] || option) + ''));
  });
  el.appendChild(node);
  node.addEventListener('change', () => {
    bind.update(param.options[node.selectedIndex]);
  });
  bind.elements = [node];
  bind.set = value => {
    for (let i = 0, n = param.options.length; i < n; ++i) {
      if (valuesEqual(param.options[i], value)) {
        node.selectedIndex = i;
        return;
      }
    }
  };
}

/**
 * Generates a radio button group.
 */
function radio(bind, el, param, value) {
  const group = element('span', {
      'class': RadioClass
    }),
    labels = param.labels || [];
  el.appendChild(group);
  bind.elements = param.options.map((option, i) => {
    const attr = {
      type: 'radio',
      name: param.signal,
      value: option
    };
    if (valuesEqual(option, value)) attr.checked = true;
    const input = element('input', attr);
    input.addEventListener('change', () => bind.update(option));
    const label = element('label', {}, (labels[i] || option) + '');
    label.prepend(input);
    group.appendChild(label);
    return input;
  });
  bind.set = value => {
    const nodes = bind.elements,
      n = nodes.length;
    for (let i = 0; i < n; ++i) {
      if (valuesEqual(nodes[i].value, value)) nodes[i].checked = true;
    }
  };
}

/**
 * Generates a slider input element.
 */
function range(bind, el, param, value) {
  value = value !== undefined ? value : (+param.max + +param.min) / 2;
  const max = param.max != null ? param.max : Math.max(100, +value) || 100,
    min = param.min || Math.min(0, max, +value) || 0,
    step = param.step || tickStep(min, max, 100);
  const node = element('input', {
    type: 'range',
    name: param.signal,
    min: min,
    max: max,
    step: step
  });
  node.value = value;
  const span = element('span', {}, +value);
  el.appendChild(node);
  el.appendChild(span);
  const update = () => {
    span.textContent = node.value;
    bind.update(+node.value);
  };

  // subscribe to both input and change
  node.addEventListener('input', update);
  node.addEventListener('change', update);
  bind.elements = [node];
  bind.set = value => {
    node.value = value;
    span.textContent = value;
  };
}
function valuesEqual(a, b) {
  return a === b || a + '' === b + '';
}

function initializeRenderer (view, r, el, constructor, scaleFactor, opt) {
  r = r || new constructor(view.loader());
  return r.initialize(el, width(view), height(view), offset(view), scaleFactor, opt).background(view.background());
}

function trap (view, fn) {
  return !fn ? null : function () {
    try {
      fn.apply(this, arguments);
    } catch (error) {
      view.error(error);
    }
  };
}

function initializeHandler (view, prevHandler, el, constructor) {
  // instantiate scenegraph handler
  const handler = new constructor(view.loader(), trap(view, view.tooltip())).scene(view.scenegraph().root).initialize(el, offset(view), view);

  // transfer event handlers
  if (prevHandler) {
    prevHandler.handlers().forEach(h => {
      handler.on(h.type, h.handler);
    });
  }
  return handler;
}

function initialize (el, elBind) {
  const view = this,
    type = view._renderType,
    config = view._eventConfig.bind,
    module = renderModule(type);

  // containing dom element
  el = view._el = el ? lookup(view, el, true) : null;

  // initialize aria attributes
  initializeAria(view);

  // select appropriate renderer & handler
  if (!module) view.error('Unrecognized renderer type: ' + type);
  const Handler = module.handler || CanvasHandler,
    Renderer = el ? module.renderer : module.headless;

  // initialize renderer and input handler
  view._renderer = !Renderer ? null : initializeRenderer(view, view._renderer, el, Renderer);
  view._handler = initializeHandler(view, view._handler, el, Handler);
  view._redraw = true;

  // initialize signal bindings
  if (el && config !== 'none') {
    elBind = elBind ? view._elBind = lookup(view, elBind, true) : el.appendChild(element('form', {
      'class': 'vega-bindings'
    }));
    view._bind.forEach(_ => {
      if (_.param.element && config !== 'container') {
        _.element = lookup(view, _.param.element, !!_.param.input);
      }
    });
    view._bind.forEach(_ => {
      bind(view, _.element || elBind, _);
    });
  }
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

const number = _ => +_ || 0;
const paddingObject = _ => ({
  top: _,
  bottom: _,
  left: _,
  right: _
});
function padding (_) {
  return isObject(_) ? {
    top: number(_.top),
    bottom: number(_.bottom),
    left: number(_.left),
    right: number(_.right)
  } : paddingObject(number(_));
}

/**
 * Render the current scene in a headless fashion.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A Promise that resolves to a renderer.
 */
async function renderHeadless (view, type, scaleFactor, opt) {
  const module = renderModule(type),
    ctr = module && module.headless;
  if (!ctr) error('Unrecognized renderer type: ' + type);
  await view.runAsync();
  return initializeRenderer(view, null, null, ctr, scaleFactor, opt).renderAsync(view._scenegraph.root);
}

/**
 * Produce an image URL for the visualization. Depending on the type
 * parameter, the generated URL contains data for either a PNG or SVG image.
 * The URL can be used (for example) to download images of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
 *   The 'canvas' and 'png' types are synonyms for a PNG image.
 * @return {Promise} - A promise that resolves to an image URL.
 */
async function renderToImageURL (type, scaleFactor) {
  if (type !== RenderType.Canvas && type !== RenderType.SVG && type !== RenderType.PNG) {
    error('Unrecognized image type: ' + type);
  }
  const r = await renderHeadless(this, type, scaleFactor);
  return type === RenderType.SVG ? toBlobURL(r.svg(), 'image/svg+xml') : r.canvas().toDataURL('image/png');
}
function toBlobURL(data, mime) {
  const blob = new Blob([data], {
    type: mime
  });
  return window.URL.createObjectURL(blob);
}

/**
 * Produce a Canvas instance containing a rendered visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to a Canvas instance.
 */
async function renderToCanvas (scaleFactor, opt) {
  const r = await renderHeadless(this, RenderType.Canvas, scaleFactor, opt);
  return r.canvas();
}

/**
 * Produce a rendered SVG string of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to an SVG string.
 */
async function renderToSVG (scaleFactor) {
  const r = await renderHeadless(this, RenderType.SVG, scaleFactor);
  return r.svg();
}

function runtime (view, spec, expr) {
  return context(view, transforms, functionContext, expr).parse(spec);
}

function scale(name) {
  var scales = this._runtime.scales;
  if (!hasOwnProperty(scales, name)) {
    error('Unrecognized scale or projection: ' + name);
  }
  return scales[name].value;
}

var Width = 'width',
  Height = 'height',
  Padding = 'padding',
  Skip = {
    skip: true
  };
function viewWidth(view, width) {
  var a = view.autosize(),
    p = view.padding();
  return width - (a && a.contains === Padding ? p.left + p.right : 0);
}
function viewHeight(view, height) {
  var a = view.autosize(),
    p = view.padding();
  return height - (a && a.contains === Padding ? p.top + p.bottom : 0);
}
function initializeResize(view) {
  var s = view._signals,
    w = s[Width],
    h = s[Height],
    p = s[Padding];
  function resetSize() {
    view._autosize = view._resize = 1;
  }

  // respond to width signal
  view._resizeWidth = view.add(null, _ => {
    view._width = _.size;
    view._viewWidth = viewWidth(view, _.size);
    resetSize();
  }, {
    size: w
  });

  // respond to height signal
  view._resizeHeight = view.add(null, _ => {
    view._height = _.size;
    view._viewHeight = viewHeight(view, _.size);
    resetSize();
  }, {
    size: h
  });

  // respond to padding signal
  const resizePadding = view.add(null, resetSize, {
    pad: p
  });

  // set rank to run immediately after source signal
  view._resizeWidth.rank = w.rank + 1;
  view._resizeHeight.rank = h.rank + 1;
  resizePadding.rank = p.rank + 1;
}
function resizeView(viewWidth, viewHeight, width, height, origin, auto) {
  this.runAfter(view => {
    let rerun = 0;

    // reset autosize flag
    view._autosize = 0;

    // width value changed: update signal, skip resize op
    if (view.width() !== width) {
      rerun = 1;
      view.signal(Width, width, Skip); // set width, skip update calc
      view._resizeWidth.skip(true); // skip width resize handler
    }

    // height value changed: update signal, skip resize op
    if (view.height() !== height) {
      rerun = 1;
      view.signal(Height, height, Skip); // set height, skip update calc
      view._resizeHeight.skip(true); // skip height resize handler
    }

    // view width changed: update view property, set resize flag
    if (view._viewWidth !== viewWidth) {
      view._resize = 1;
      view._viewWidth = viewWidth;
    }

    // view height changed: update view property, set resize flag
    if (view._viewHeight !== viewHeight) {
      view._resize = 1;
      view._viewHeight = viewHeight;
    }

    // origin changed: update view property, set resize flag
    if (view._origin[0] !== origin[0] || view._origin[1] !== origin[1]) {
      view._resize = 1;
      view._origin = origin;
    }

    // run dataflow on width/height signal change
    if (rerun) view.run('enter');
    if (auto) view.runAfter(v => v.resize());
  }, false, 1);
}

/**
 * Get the current view state, consisting of signal values and/or data sets.
 * @param {object} [options] - Options flags indicating which state to export.
 *   If unspecified, all signals and data sets will be exported.
 * @param {function(string, Operator):boolean} [options.signals] - Optional
 *   predicate function for testing if a signal should be included in the
 *   exported state. If unspecified, all signals will be included, except for
 *   those named 'parent' or those which refer to a Transform value.
 * @param {function(string, object):boolean} [options.data] - Optional
 *   predicate function for testing if a data set's input should be included
 *   in the exported state. If unspecified, all data sets that have been
 *   explicitly modified will be included.
 * @param {boolean} [options.recurse=true] - Flag indicating if the exported
 *   state should recursively include state from group mark sub-contexts.
 * @return {object} - An object containing the exported state values.
 */
function getState(options) {
  return this._runtime.getState(options || {
    data: dataTest,
    signals: signalTest,
    recurse: true
  });
}
function dataTest(name, data) {
  return data.modified && isArray(data.input.value) && name.indexOf('_:vega:_');
}
function signalTest(name, op) {
  return !(name === 'parent' || op instanceof transforms.proxy);
}

/**
 * Sets the current view state and updates the view by invoking run.
 * @param {object} state - A state object containing signal and/or
 *   data set values, following the format used by the getState method.
 * @return {View} - This view instance.
 */
function setState(state) {
  this.runAsync(null, v => {
    v._trigger = false;
    v._runtime.setState(state);
  }, v => {
    v._trigger = true;
  });
  return this;
}

function timer (callback, delay) {
  function tick(elapsed) {
    callback({
      timestamp: Date.now(),
      elapsed: elapsed
    });
  }
  this._timers.push(interval(tick, delay));
}

function defaultTooltip (handler, event, item, value) {
  const el = handler.element();
  if (el) el.setAttribute('title', formatTooltip(value));
}
function formatTooltip(value) {
  return value == null ? '' : isArray(value) ? formatArray(value) : isObject(value) && !isDate(value) ? formatObject(value) : value + '';
}
function formatObject(obj) {
  return Object.keys(obj).map(key => {
    const v = obj[key];
    return key + ': ' + (isArray(v) ? formatArray(v) : formatValue(v));
  }).join('\n');
}
function formatArray(value) {
  return '[' + value.map(formatValue).join(', ') + ']';
}
function formatValue(value) {
  return isArray(value) ? '[\u2026]' : isObject(value) && !isDate(value) ? '{\u2026}' : value;
}

/**
 * Create a new View instance from a Vega dataflow runtime specification.
 * The generated View will not immediately be ready for display. Callers
 * should also invoke the initialize method (e.g., to set the parent
 * DOM element in browser-based deployment) and then invoke the run
 * method to evaluate the dataflow graph. Rendering will automatically
 * be performed upon dataflow runs.
 * @constructor
 * @param {object} spec - The Vega dataflow runtime specification.
 */
function View(spec, options) {
  const view = this;
  options = options || {};
  Dataflow.call(view);
  if (options.loader) view.loader(options.loader);
  if (options.logger) view.logger(options.logger);
  if (options.logLevel != null) view.logLevel(options.logLevel);
  if (options.locale || spec.locale) {
    const loc = extend({}, spec.locale, options.locale);
    view.locale(locale(loc.number, loc.time));
  }
  view._el = null;
  view._elBind = null;
  view._renderType = options.renderer || RenderType.Canvas;
  view._scenegraph = new Scenegraph();
  const root = view._scenegraph.root;

  // initialize renderer, handler and event management
  view._renderer = null;
  view._tooltip = options.tooltip || defaultTooltip, view._redraw = true;
  view._handler = new CanvasHandler().scene(root);
  view._globalCursor = false;
  view._preventDefault = false;
  view._timers = [];
  view._eventListeners = [];
  view._resizeListeners = [];

  // initialize event configuration
  view._eventConfig = initializeEventConfig(spec.eventConfig);
  view.globalCursor(view._eventConfig.globalCursor);

  // initialize dataflow graph
  const ctx = runtime(view, spec, options.expr);
  view._runtime = ctx;
  view._signals = ctx.signals;
  view._bind = (spec.bindings || []).map(_ => ({
    state: null,
    param: extend({}, _)
  }));

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  root.source = ctx.data.root.input;
  view.pulse(ctx.data.root.input, view.changeset().insert(root.items));

  // initialize view size
  view._width = view.width();
  view._height = view.height();
  view._viewWidth = viewWidth(view, view._width);
  view._viewHeight = viewHeight(view, view._height);
  view._origin = [0, 0];
  view._resize = 0;
  view._autosize = 1;
  initializeResize(view);

  // initialize background color
  background(view);

  // initialize cursor
  cursor(view);

  // initialize view description
  view.description(spec.description);

  // initialize hover proessing, if requested
  if (options.hover) view.hover();

  // initialize DOM container(s) and renderer
  if (options.container) view.initialize(options.container, options.bind);
}
function lookupSignal(view, name) {
  return hasOwnProperty(view._signals, name) ? view._signals[name] : error('Unrecognized signal name: ' + stringValue(name));
}
function findOperatorHandler(op, handler) {
  const h = (op._targets || []).filter(op => op._update && op._update.handler === handler);
  return h.length ? h[0] : null;
}
function addOperatorListener(view, name, op, handler) {
  let h = findOperatorHandler(op, handler);
  if (!h) {
    h = trap(view, () => handler(name, op.value));
    h.handler = handler;
    view.on(op, null, h);
  }
  return view;
}
function removeOperatorListener(view, op, handler) {
  const h = findOperatorHandler(op, handler);
  if (h) op._targets.remove(h);
  return view;
}
inherits(View, Dataflow, {
  // -- DATAFLOW / RENDERING ----

  async evaluate(encode, prerun, postrun) {
    // evaluate dataflow and prerun
    await Dataflow.prototype.evaluate.call(this, encode, prerun);

    // render as needed
    if (this._redraw || this._resize) {
      try {
        if (this._renderer) {
          if (this._resize) {
            this._resize = 0;
            resizeRenderer(this);
          }
          await this._renderer.renderAsync(this._scenegraph.root);
        }
        this._redraw = false;
      } catch (e) {
        this.error(e);
      }
    }

    // evaluate postrun
    if (postrun) asyncCallback(this, postrun);
    return this;
  },
  dirty(item) {
    this._redraw = true;
    this._renderer && this._renderer.dirty(item);
  },
  // -- GET / SET ----

  description(text) {
    if (arguments.length) {
      const desc = text != null ? text + '' : null;
      if (desc !== this._desc) ariaLabel(this._el, this._desc = desc);
      return this;
    }
    return this._desc;
  },
  container() {
    return this._el;
  },
  scenegraph() {
    return this._scenegraph;
  },
  origin() {
    return this._origin.slice();
  },
  signal(name, value, options) {
    const op = lookupSignal(this, name);
    return arguments.length === 1 ? op.value : this.update(op, value, options);
  },
  width(_) {
    return arguments.length ? this.signal('width', _) : this.signal('width');
  },
  height(_) {
    return arguments.length ? this.signal('height', _) : this.signal('height');
  },
  padding(_) {
    return arguments.length ? this.signal('padding', padding(_)) : padding(this.signal('padding'));
  },
  autosize(_) {
    return arguments.length ? this.signal('autosize', _) : this.signal('autosize');
  },
  background(_) {
    return arguments.length ? this.signal('background', _) : this.signal('background');
  },
  renderer(type) {
    if (!arguments.length) return this._renderType;
    if (!renderModule(type)) error('Unrecognized renderer type: ' + type);
    if (type !== this._renderType) {
      this._renderType = type;
      this._resetRenderer();
    }
    return this;
  },
  tooltip(handler) {
    if (!arguments.length) return this._tooltip;
    if (handler !== this._tooltip) {
      this._tooltip = handler;
      this._resetRenderer();
    }
    return this;
  },
  loader(loader) {
    if (!arguments.length) return this._loader;
    if (loader !== this._loader) {
      Dataflow.prototype.loader.call(this, loader);
      this._resetRenderer();
    }
    return this;
  },
  resize() {
    // set flag to perform autosize
    this._autosize = 1;
    // touch autosize signal to ensure top-level ViewLayout runs
    return this.touch(lookupSignal(this, 'autosize'));
  },
  _resetRenderer() {
    if (this._renderer) {
      this._renderer = null;
      this.initialize(this._el, this._elBind);
    }
  },
  // -- SIZING ----
  _resizeView: resizeView,
  // -- EVENT HANDLING ----

  addEventListener(type, handler, options) {
    let callback = handler;
    if (!(options && options.trap === false)) {
      // wrap callback in error handler
      callback = trap(this, handler);
      callback.raw = handler;
    }
    this._handler.on(type, callback);
    return this;
  },
  removeEventListener(type, handler) {
    var handlers = this._handler.handlers(type),
      i = handlers.length,
      h,
      t;

    // search registered handlers, remove if match found
    while (--i >= 0) {
      t = handlers[i].type;
      h = handlers[i].handler;
      if (type === t && (handler === h || handler === h.raw)) {
        this._handler.off(t, h);
        break;
      }
    }
    return this;
  },
  addResizeListener(handler) {
    const l = this._resizeListeners;
    if (l.indexOf(handler) < 0) {
      // add handler if it isn't already registered
      // note: error trapping handled elsewhere, so
      // no need to wrap handlers here
      l.push(handler);
    }
    return this;
  },
  removeResizeListener(handler) {
    var l = this._resizeListeners,
      i = l.indexOf(handler);
    if (i >= 0) {
      l.splice(i, 1);
    }
    return this;
  },
  addSignalListener(name, handler) {
    return addOperatorListener(this, name, lookupSignal(this, name), handler);
  },
  removeSignalListener(name, handler) {
    return removeOperatorListener(this, lookupSignal(this, name), handler);
  },
  addDataListener(name, handler) {
    return addOperatorListener(this, name, dataref(this, name).values, handler);
  },
  removeDataListener(name, handler) {
    return removeOperatorListener(this, dataref(this, name).values, handler);
  },
  globalCursor(_) {
    if (arguments.length) {
      if (this._globalCursor !== !!_) {
        const prev = setCursor(this, null); // clear previous cursor
        this._globalCursor = !!_;
        if (prev) setCursor(this, prev); // swap cursor
      }

      return this;
    } else {
      return this._globalCursor;
    }
  },
  preventDefault(_) {
    if (arguments.length) {
      this._preventDefault = _;
      return this;
    } else {
      return this._preventDefault;
    }
  },
  timer,
  events,
  finalize,
  hover,
  // -- DATA ----
  data,
  change,
  insert,
  remove,
  // -- SCALES --
  scale,
  // -- INITIALIZATION ----
  initialize,
  // -- HEADLESS RENDERING ----
  toImageURL: renderToImageURL,
  toCanvas: renderToCanvas,
  toSVG: renderToSVG,
  // -- SAVE / RESTORE STATE ----
  getState,
  setState
});

export { View };

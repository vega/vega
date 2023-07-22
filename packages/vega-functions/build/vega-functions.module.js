import { truthy, error, hasOwnProperty, isFunction, isString, stringValue, extend, isArray, isObject, field, peek, identity, array as array$1, isBoolean, isDate, isNumber, isRegExp, toBoolean, toDate, toNumber, toString, flush, lerp, pad, span, inrange, truncate, quarter, utcquarter, extent, clampRange, panLinear, panLog, panPow, panSymlog, zoomLinear, zoomLog, zoomPow, zoomSymlog } from 'vega-util';
import { Literal, codegenExpression, constants, functions, parseExpression, CallExpression } from 'vega-expression';
import { isRegisteredScale, bandSpace, scale as scale$1, scaleFraction } from 'vega-scale';
import { geoArea as geoArea$1, geoBounds as geoBounds$1, geoCentroid as geoCentroid$1 } from 'd3-geo';
import { rgb, lab, hcl, hsl } from 'd3-color';
import { isTuple } from 'vega-dataflow';
import { Gradient, pathRender, pathParse, Bounds, intersect as intersect$1 } from 'vega-scenegraph';
import { selectionVisitor, selectionTest, selectionIdTest, selectionResolve, selectionTuples } from 'vega-selections';
import { random, cumulativeNormal, cumulativeLogNormal, cumulativeUniform, densityNormal, densityLogNormal, densityUniform, quantileNormal, quantileLogNormal, quantileUniform, sampleNormal, sampleLogNormal, sampleUniform } from 'vega-statistics';
import { utcOffset, utcSequence, timeOffset, timeSequence, timeUnitSpecifier, week, utcweek, dayofyear, utcdayofyear } from 'vega-time';
import { range as range$1 } from 'd3-array';

function data(name) {
  const data = this.context.data[name];
  return data ? data.values.value : [];
}
function indata(name, field, value) {
  const index = this.context.data[name]['index:' + field],
    entry = index ? index.value.get(value) : undefined;
  return entry ? entry.count : entry;
}
function setdata(name, tuples) {
  const df = this.context.dataflow,
    data = this.context.data[name],
    input = data.input;
  df.pulse(input, df.changeset().remove(truthy).insert(tuples));
  return 1;
}

function encode (item, name, retval) {
  if (item) {
    const df = this.context.dataflow,
      target = item.mark.source;
    df.pulse(target, df.changeset().encode(item, name));
  }
  return retval !== undefined ? retval : item;
}

const wrap = method => function (value, spec) {
  const locale = this.context.dataflow.locale();
  return locale[method](spec)(value);
};
const format = wrap('format');
const timeFormat = wrap('timeFormat');
const utcFormat = wrap('utcFormat');
const timeParse = wrap('timeParse');
const utcParse = wrap('utcParse');
const dateObj = new Date(2000, 0, 1);
function time(month, day, specifier) {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return '';
  dateObj.setYear(2000);
  dateObj.setMonth(month);
  dateObj.setDate(day);
  return timeFormat.call(this, dateObj, specifier);
}
function monthFormat(month) {
  return time.call(this, month, 1, '%B');
}
function monthAbbrevFormat(month) {
  return time.call(this, month, 1, '%b');
}
function dayFormat(day) {
  return time.call(this, 0, 2 + day, '%A');
}
function dayAbbrevFormat(day) {
  return time.call(this, 0, 2 + day, '%a');
}

const DataPrefix = ':';
const IndexPrefix = '@';
const ScalePrefix = '%';
const SignalPrefix = '$';

function dataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) {
    error('First argument to data functions must be a string literal.');
  }
  const data = args[0].value,
    dataName = DataPrefix + data;
  if (!hasOwnProperty(dataName, params)) {
    try {
      params[dataName] = scope.getData(data).tuplesRef();
    } catch (err) {
      // if data set does not exist, there's nothing to track
    }
  }
}
function indataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to indata must be a string literal.');
  if (args[1].type !== Literal) error('Second argument to indata must be a string literal.');
  const data = args[0].value,
    field = args[1].value,
    indexName = IndexPrefix + field;
  if (!hasOwnProperty(indexName, params)) {
    params[indexName] = scope.getData(data).indataRef(scope, field);
  }
}
function scaleVisitor(name, args, scope, params) {
  if (args[0].type === Literal) {
    // add scale dependency
    addScaleDependency(scope, params, args[0].value);
  } else {
    // indirect scale lookup; add all scales as parameters
    for (name in scope.scales) {
      addScaleDependency(scope, params, name);
    }
  }
}
function addScaleDependency(scope, params, name) {
  const scaleName = ScalePrefix + name;
  if (!hasOwnProperty(params, scaleName)) {
    try {
      params[scaleName] = scope.scaleRef(name);
    } catch (err) {
      // TODO: error handling? warning?
    }
  }
}

function getScale(nameOrFunction, ctx) {
  if (isFunction(nameOrFunction)) {
    return nameOrFunction;
  }
  if (isString(nameOrFunction)) {
    const maybeScale = ctx.scales[nameOrFunction];
    return maybeScale && isRegisteredScale(maybeScale.value) ? maybeScale.value : undefined;
  }
  return undefined;
}
function internalScaleFunctions(codegen, fnctx, visitors) {
  // add helper method to the 'this' expression function context
  fnctx.__bandwidth = s => s && s.bandwidth ? s.bandwidth() : 0;

  // register AST visitors for internal scale functions
  visitors._bandwidth = scaleVisitor;
  visitors._range = scaleVisitor;
  visitors._scale = scaleVisitor;

  // resolve scale reference directly to the signal hash argument
  const ref = arg => '_[' + (arg.type === Literal ? stringValue(ScalePrefix + arg.value) : stringValue(ScalePrefix) + '+' + codegen(arg)) + ']';

  // define and return internal scale function code generators
  // these internal functions are called by mark encoders
  return {
    _bandwidth: args => `this.__bandwidth(${ref(args[0])})`,
    _range: args => `${ref(args[0])}.range()`,
    _scale: args => `${ref(args[0])}(${codegen(args[1])})`
  };
}

function geoMethod(methodName, globalMethod) {
  return function (projection, geojson, group) {
    if (projection) {
      // projection defined, use it
      const p = getScale(projection, (group || this).context);
      return p && p.path[methodName](geojson);
    } else {
      // projection undefined, use global method
      return globalMethod(geojson);
    }
  };
}
const geoArea = geoMethod('area', geoArea$1);
const geoBounds = geoMethod('bounds', geoBounds$1);
const geoCentroid = geoMethod('centroid', geoCentroid$1);

function inScope (item) {
  const group = this.context.group;
  let value = false;
  if (group) while (item) {
    if (item === group) {
      value = true;
      break;
    }
    item = item.mark.group;
  }
  return value;
}

function log(df, method, args) {
  try {
    df[method].apply(df, ['EXPRESSION'].concat([].slice.call(args)));
  } catch (err) {
    df.warn(err);
  }
  return args[args.length - 1];
}
function warn() {
  return log(this.context.dataflow, 'warn', arguments);
}
function info() {
  return log(this.context.dataflow, 'info', arguments);
}
function debug() {
  return log(this.context.dataflow, 'debug', arguments);
}

// https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
function channel_luminance_value(channelValue) {
  const val = channelValue / 255;
  if (val <= 0.03928) {
    return val / 12.92;
  }
  return Math.pow((val + 0.055) / 1.055, 2.4);
}
function luminance(color) {
  const c = rgb(color),
    r = channel_luminance_value(c.r),
    g = channel_luminance_value(c.g),
    b = channel_luminance_value(c.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
function contrast(color1, color2) {
  const lum1 = luminance(color1),
    lum2 = luminance(color2),
    lumL = Math.max(lum1, lum2),
    lumD = Math.min(lum1, lum2);
  return (lumL + 0.05) / (lumD + 0.05);
}

function merge () {
  const args = [].slice.call(arguments);
  args.unshift({});
  return extend(...args);
}

function equal(a, b) {
  return a === b || a !== a && b !== b ? true : isArray(a) ? isArray(b) && a.length === b.length ? equalArray(a, b) : false : isObject(a) && isObject(b) ? equalObject(a, b) : false;
}
function equalArray(a, b) {
  for (let i = 0, n = a.length; i < n; ++i) {
    if (!equal(a[i], b[i])) return false;
  }
  return true;
}
function equalObject(a, b) {
  for (const key in a) {
    if (!equal(a[key], b[key])) return false;
  }
  return true;
}
function removePredicate(props) {
  return _ => equalObject(props, _);
}
function modify (name, insert, remove, toggle, modify, values) {
  const df = this.context.dataflow,
    data = this.context.data[name],
    input = data.input,
    stamp = df.stamp();
  let changes = data.changes,
    predicate,
    key;
  if (df._trigger === false || !(input.value.length || insert || toggle)) {
    // nothing to do!
    return 0;
  }
  if (!changes || changes.stamp < stamp) {
    data.changes = changes = df.changeset();
    changes.stamp = stamp;
    df.runAfter(() => {
      data.modified = true;
      df.pulse(input, changes).run();
    }, true, 1);
  }
  if (remove) {
    predicate = remove === true ? truthy : isArray(remove) || isTuple(remove) ? remove : removePredicate(remove);
    changes.remove(predicate);
  }
  if (insert) {
    changes.insert(insert);
  }
  if (toggle) {
    predicate = removePredicate(toggle);
    if (input.value.some(predicate)) {
      changes.remove(predicate);
    } else {
      changes.insert(toggle);
    }
  }
  if (modify) {
    for (key in values) {
      changes.modify(modify, key, values[key]);
    }
  }
  return 1;
}

function pinchDistance(event) {
  const t = event.touches,
    dx = t[0].clientX - t[1].clientX,
    dy = t[0].clientY - t[1].clientY;
  return Math.hypot(dx, dy);
}
function pinchAngle(event) {
  const t = event.touches;
  return Math.atan2(t[0].clientY - t[1].clientY, t[0].clientX - t[1].clientX);
}

// memoize accessor functions
const accessors = {};
function pluck (data, name) {
  const accessor = accessors[name] || (accessors[name] = field(name));
  return isArray(data) ? data.map(accessor) : accessor(data);
}

function array(seq) {
  return isArray(seq) || ArrayBuffer.isView(seq) ? seq : null;
}
function sequence(seq) {
  return array(seq) || (isString(seq) ? seq : null);
}
function join(seq) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  return array(seq).join(...args);
}
function indexof(seq) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }
  return sequence(seq).indexOf(...args);
}
function lastindexof(seq) {
  for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    args[_key3 - 1] = arguments[_key3];
  }
  return sequence(seq).lastIndexOf(...args);
}
function slice(seq) {
  for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    args[_key4 - 1] = arguments[_key4];
  }
  return sequence(seq).slice(...args);
}
function replace(str, pattern, repl) {
  if (isFunction(repl)) error('Function argument passed to replace.');
  return String(str).replace(pattern, repl);
}
function reverse(seq) {
  return array(seq).slice().reverse();
}

function bandspace(count, paddingInner, paddingOuter) {
  return bandSpace(count || 0, paddingInner || 0, paddingOuter || 0);
}
function bandwidth(name, group) {
  const s = getScale(name, (group || this).context);
  return s && s.bandwidth ? s.bandwidth() : 0;
}
function copy(name, group) {
  const s = getScale(name, (group || this).context);
  return s ? s.copy() : undefined;
}
function domain(name, group) {
  const s = getScale(name, (group || this).context);
  return s ? s.domain() : [];
}
function invert(name, range, group) {
  const s = getScale(name, (group || this).context);
  return !s ? undefined : isArray(range) ? (s.invertRange || s.invert)(range) : (s.invert || s.invertExtent)(range);
}
function range(name, group) {
  const s = getScale(name, (group || this).context);
  return s && s.range ? s.range() : [];
}
function scale(name, value, group) {
  const s = getScale(name, (group || this).context);
  return s ? s(value) : undefined;
}

function scaleGradient (scale, p0, p1, count, group) {
  scale = getScale(scale, (group || this).context);
  const gradient = Gradient(p0, p1);
  let stops = scale.domain(),
    min = stops[0],
    max = peek(stops),
    fraction = identity;
  if (!(max - min)) {
    // expand scale if domain has zero span, fix #1479
    scale = (scale.interpolator ? scale$1('sequential')().interpolator(scale.interpolator()) : scale$1('linear')().interpolate(scale.interpolate()).range(scale.range())).domain([min = 0, max = 1]);
  } else {
    fraction = scaleFraction(scale, min, max);
  }
  if (scale.ticks) {
    stops = scale.ticks(+count || 15);
    if (min !== stops[0]) stops.unshift(min);
    if (max !== peek(stops)) stops.push(max);
  }
  stops.forEach(_ => gradient.stop(fraction(_), scale(_)));
  return gradient;
}

function geoShape(projection, geojson, group) {
  const p = getScale(projection, (group || this).context);
  return function (context) {
    return p ? p.path.context(context)(geojson) : '';
  };
}
function pathShape(path) {
  let p = null;
  return function (context) {
    return context ? pathRender(context, p = p || pathParse(path)) : path;
  };
}

const datum = d => d.data;
function treeNodes(name, context) {
  const tree = data.call(context, name);
  return tree.root && tree.root.lookup || {};
}
function treePath(name, source, target) {
  const nodes = treeNodes(name, this),
    s = nodes[source],
    t = nodes[target];
  return s && t ? s.path(t).map(datum) : undefined;
}
function treeAncestors(name, node) {
  const n = treeNodes(name, this)[node];
  return n ? n.ancestors().map(datum) : undefined;
}

const _window = () => typeof window !== 'undefined' && window || null;
function screen() {
  const w = _window();
  return w ? w.screen : {};
}
function windowSize() {
  const w = _window();
  return w ? [w.innerWidth, w.innerHeight] : [undefined, undefined];
}
function containerSize() {
  const view = this.context.dataflow,
    el = view.container && view.container();
  return el ? [el.clientWidth, el.clientHeight] : [undefined, undefined];
}

function intersect (b, opt, group) {
  if (!b) return [];
  const [u, v] = b,
    box = new Bounds().set(u[0], u[1], v[0], v[1]),
    scene = group || this.context.dataflow.scenegraph().root;
  return intersect$1(scene, box, filter(opt));
}
function filter(opt) {
  let p = null;
  if (opt) {
    const types = array$1(opt.marktype),
      names = array$1(opt.markname);
    p = _ => (!types.length || types.some(t => _.marktype === t)) && (!names.length || names.some(s => _.name === s));
  }
  return p;
}

/**
 * Appends a new point to the lasso
 *
 * @param {*} lasso the lasso in pixel space
 * @param {*} x the x coordinate in pixel space
 * @param {*} y the y coordinate in pixel space
 * @param {*} minDist the minimum distance, in pixels, that thenew point needs to be apart from the last point
 * @returns a new array containing the lasso with the new point
 */
function lassoAppend(lasso, x, y) {
  let minDist = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 5;
  lasso = array$1(lasso);
  const last = lasso[lasso.length - 1];

  // Add point to lasso if its the first point or distance to last point exceed minDist
  return last === undefined || Math.hypot(last[0] - x, last[1] - y) > minDist ? [...lasso, [x, y]] : lasso;
}

/**
 * Generates a svg path command which draws a lasso
 *
 * @param {*} lasso the lasso in pixel space in the form [[x,y], [x,y], ...]
 * @returns the svg path command that draws the lasso
 */
function lassoPath(lasso) {
  return array$1(lasso).reduce((svg, _ref, i) => {
    let [x, y] = _ref;
    return svg += i == 0 ? `M ${x},${y} ` : i === lasso.length - 1 ? ' Z' : `L ${x},${y} `;
  }, '');
}

/**
 * Inverts the lasso from pixel space to an array of vega scenegraph tuples
 *
 * @param {*} data the dataset
 * @param {*} pixelLasso the lasso in pixel space, [[x,y], [x,y], ...]
 * @param {*} unit the unit where the lasso is defined
 *
 * @returns an array of vega scenegraph tuples
 */
function intersectLasso(markname, pixelLasso, unit) {
  const {
    x,
    y,
    mark
  } = unit;
  const bb = new Bounds().set(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

  // Get bounding box around lasso
  for (const [px, py] of pixelLasso) {
    if (px < bb.x1) bb.x1 = px;
    if (px > bb.x2) bb.x2 = px;
    if (py < bb.y1) bb.y1 = py;
    if (py > bb.y2) bb.y2 = py;
  }

  // Translate bb against unit coordinates
  bb.translate(x, y);
  const intersection = intersect([[bb.x1, bb.y1], [bb.x2, bb.y2]], markname, mark);

  // Check every point against the lasso
  return intersection.filter(tuple => pointInPolygon(tuple.x, tuple.y, pixelLasso));
}

/**
 * Performs a test if a point is inside a polygon based on the idea from
 * https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
 *
 * This method will not need the same start/end point since it wraps around the edges of the array
 *
 * @param {*} test a point to test against
 * @param {*} polygon a polygon in the form [[x,y], [x,y], ...]
 * @returns true if the point lies inside the polygon, false otherwise
 */
function pointInPolygon(testx, testy, polygon) {
  let intersections = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [prevX, prevY] = polygon[j];
    const [x, y] = polygon[i];

    // count intersections
    if (y > testy != prevY > testy && testx < (prevX - x) * (testy - y) / (prevY - y) + x) {
      intersections++;
    }
  }

  // point is in polygon if intersection count is odd
  return intersections & 1;
}

// Expression function context object
const functionContext = {
  random() {
    return random();
  },
  // override default
  cumulativeNormal,
  cumulativeLogNormal,
  cumulativeUniform,
  densityNormal,
  densityLogNormal,
  densityUniform,
  quantileNormal,
  quantileLogNormal,
  quantileUniform,
  sampleNormal,
  sampleLogNormal,
  sampleUniform,
  isArray,
  isBoolean,
  isDate,
  isDefined(_) {
    return _ !== undefined;
  },
  isNumber,
  isObject,
  isRegExp,
  isString,
  isTuple,
  isValid(_) {
    return _ != null && _ === _;
  },
  toBoolean,
  toDate(_) {
    return toDate(_);
  },
  // suppress extra arguments
  toNumber,
  toString,
  indexof,
  join,
  lastindexof,
  replace,
  reverse,
  slice,
  flush,
  lerp,
  merge,
  pad,
  peek,
  pluck,
  span,
  inrange,
  truncate,
  rgb,
  lab,
  hcl,
  hsl,
  luminance,
  contrast,
  sequence: range$1,
  format,
  utcFormat,
  utcParse,
  utcOffset,
  utcSequence,
  timeFormat,
  timeParse,
  timeOffset,
  timeSequence,
  timeUnitSpecifier,
  monthFormat,
  monthAbbrevFormat,
  dayFormat,
  dayAbbrevFormat,
  quarter,
  utcquarter,
  week,
  utcweek,
  dayofyear,
  utcdayofyear,
  warn,
  info,
  debug,
  extent(_) {
    return extent(_);
  },
  // suppress extra arguments
  inScope,
  intersect,
  clampRange,
  pinchDistance,
  pinchAngle,
  screen,
  containerSize,
  windowSize,
  bandspace,
  setdata,
  pathShape,
  panLinear,
  panLog,
  panPow,
  panSymlog,
  zoomLinear,
  zoomLog,
  zoomPow,
  zoomSymlog,
  encode,
  modify,
  lassoAppend,
  lassoPath,
  intersectLasso
};
const eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'],
  // event functions
  eventPrefix = 'event.vega.',
  // event function prefix
  thisPrefix = 'this.',
  // function context prefix
  astVisitors = {}; // AST visitors for dependency analysis

// export code generator parameters
const codegenParams = {
  forbidden: ['_'],
  allowed: ['datum', 'event', 'item'],
  fieldvar: 'datum',
  globalvar: id => `_[${stringValue(SignalPrefix + id)}]`,
  functions: buildFunctions,
  constants: constants,
  visitors: astVisitors
};

// export code generator
const codeGenerator = codegenExpression(codegenParams);

// Build expression function registry
function buildFunctions(codegen) {
  const fn = functions(codegen);
  eventFunctions.forEach(name => fn[name] = eventPrefix + name);
  for (const name in functionContext) {
    fn[name] = thisPrefix + name;
  }
  extend(fn, internalScaleFunctions(codegen, functionContext, astVisitors));
  return fn;
}

// Register an expression function
function expressionFunction(name, fn, visitor) {
  if (arguments.length === 1) {
    return functionContext[name];
  }

  // register with the functionContext
  functionContext[name] = fn;

  // if there is an astVisitor register that, too
  if (visitor) astVisitors[name] = visitor;

  // if the code generator has already been initialized,
  // we need to also register the function with it
  if (codeGenerator) codeGenerator.functions[name] = thisPrefix + name;
  return this;
}

// register expression functions with ast visitors
expressionFunction('bandwidth', bandwidth, scaleVisitor);
expressionFunction('copy', copy, scaleVisitor);
expressionFunction('domain', domain, scaleVisitor);
expressionFunction('range', range, scaleVisitor);
expressionFunction('invert', invert, scaleVisitor);
expressionFunction('scale', scale, scaleVisitor);
expressionFunction('gradient', scaleGradient, scaleVisitor);
expressionFunction('geoArea', geoArea, scaleVisitor);
expressionFunction('geoBounds', geoBounds, scaleVisitor);
expressionFunction('geoCentroid', geoCentroid, scaleVisitor);
expressionFunction('geoShape', geoShape, scaleVisitor);
expressionFunction('indata', indata, indataVisitor);
expressionFunction('data', data, dataVisitor);
expressionFunction('treePath', treePath, dataVisitor);
expressionFunction('treeAncestors', treeAncestors, dataVisitor);

// register Vega-Lite selection functions
expressionFunction('vlSelectionTest', selectionTest, selectionVisitor);
expressionFunction('vlSelectionIdTest', selectionIdTest, selectionVisitor);
expressionFunction('vlSelectionResolve', selectionResolve, selectionVisitor);
expressionFunction('vlSelectionTuples', selectionTuples);

function parser (expr, scope) {
  const params = {};

  // parse the expression to an abstract syntax tree (ast)
  let ast;
  try {
    expr = isString(expr) ? expr : stringValue(expr) + '';
    ast = parseExpression(expr);
  } catch (err) {
    error('Expression parse error: ' + expr);
  }

  // analyze ast function calls for dependencies
  ast.visit(node => {
    if (node.type !== CallExpression) return;
    const name = node.callee.name,
      visit = codegenParams.visitors[name];
    if (visit) visit(name, node.arguments, scope, params);
  });

  // perform code generation
  const gen = codeGenerator(ast);

  // collect signal dependencies
  gen.globals.forEach(name => {
    const signalName = SignalPrefix + name;
    if (!hasOwnProperty(params, signalName) && scope.getSignal(name)) {
      params[signalName] = scope.signalRef(name);
    }
  });

  // return generated expression code and dependencies
  return {
    $expr: extend({
      code: gen.code
    }, scope.options.ast ? {
      ast
    } : null),
    $fields: gen.fields,
    $params: params
  };
}

export { DataPrefix, IndexPrefix, ScalePrefix, SignalPrefix, bandspace, bandwidth, codeGenerator, codegenParams, containerSize, contrast, copy, data, dataVisitor, dayAbbrevFormat, dayFormat, debug, domain, encode, expressionFunction, format, functionContext, geoArea, geoBounds, geoCentroid, geoShape, inScope, indata, indataVisitor, indexof, info, invert, join, lastindexof, luminance, merge, modify, monthAbbrevFormat, monthFormat, parser as parseExpression, pathShape, pinchAngle, pinchDistance, pluck, range, replace, reverse, scale, scaleGradient, scaleVisitor, screen, setdata, slice, timeFormat, timeParse, treeAncestors, treePath, utcFormat, utcParse, warn, windowSize };

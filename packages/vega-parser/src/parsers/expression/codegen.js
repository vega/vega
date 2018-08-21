import {isTuple} from 'vega-dataflow';
import {codegen, constants, functions} from 'vega-expression';
import {random} from 'vega-statistics';
import {
  isArray, isBoolean, isDate, isNumber, isObject, isRegExp, isString,
  panLinear, panLog, panPow, zoomLinear, zoomLog, zoomPow,
  toBoolean, toDate, toNumber, toString,
  pad, peek, stringValue, truncate
} from 'vega-util';
import {rgb, lab, hcl, hsl} from 'd3-color';
import {range as sequence} from 'd3-array';

import {
  format, utcFormat, timeFormat, utcParse, timeParse,
  monthFormat, monthAbbrevFormat,
  dayFormat, dayAbbrevFormat
} from './format';
import {extent, inrange, clampRange, span} from './arrays';
import {quarter, utcquarter} from './quarter';
import {warn, info, debug} from './log';
import inScope from './inscope';
import {pinchDistance, pinchAngle} from './pinch';
import {containerSize, screen, windowSize} from './window';
import flush from './flush';
import merge from './merge';
import {range, domain, bandwidth, bandspace, copy, scale, invert, scaleVisitor} from './scale';
import scaleGradient from './scale-gradient';
import {geoArea, geoBounds, geoCentroid} from './geo';
import {geoShape, pathShape} from './shape';
import {data, indata, setdata, dataVisitor, indataVisitor} from './data';
import {treePath, treeAncestors} from './tree';
import encode from './encode';
import modify from './modify';
import {vlSelectionTest, vlSelectionResolve, vlSelectionVisitor} from './selection';
import {vlPoint, vlPointDomain, vlMultiVisitor, vlInterval, vlIntervalDomain} from './selection.deprecated';

// Expression function context object
export var functionContext = {
  random: function() { return random(); }, // override default
  isArray: isArray,
  isBoolean: isBoolean,
  isDate: isDate,
  isNumber: isNumber,
  isObject: isObject,
  isRegExp: isRegExp,
  isString: isString,
  isTuple: isTuple,
  toBoolean: toBoolean,
  toDate: toDate,
  toNumber: toNumber,
  toString: toString,
  pad: pad,
  peek: peek,
  truncate: truncate,
  rgb: rgb,
  lab: lab,
  hcl: hcl,
  hsl: hsl,
  sequence: sequence,
  format: format,
  utcFormat: utcFormat,
  utcParse: utcParse,
  timeFormat: timeFormat,
  timeParse: timeParse,
  monthFormat: monthFormat,
  monthAbbrevFormat: monthAbbrevFormat,
  dayFormat: dayFormat,
  dayAbbrevFormat: dayAbbrevFormat,
  quarter: quarter,
  utcquarter: utcquarter,
  warn: warn,
  info: info,
  debug: debug,
  extent: extent,
  inScope: inScope,
  clampRange: clampRange,
  pinchDistance: pinchDistance,
  pinchAngle: pinchAngle,
  screen: screen,
  containerSize: containerSize,
  windowSize: windowSize,
  span: span,
  merge: merge,
  flush: flush,
  bandspace: bandspace,
  inrange: inrange,
  setdata: setdata,
  pathShape: pathShape,
  panLinear: panLinear,
  panLog: panLog,
  panPow: panPow,
  zoomLinear: zoomLinear,
  zoomLog: zoomLog,
  zoomPow: zoomPow,
  encode: encode,
  modify: modify
};

var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'], // event functions
    eventPrefix = 'event.vega.', // event function prefix
    thisPrefix = 'this.', // function context prefix
    astVisitors = {}; // AST visitors for dependency analysis

export function expressionFunction(name, fn, visitor) {
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

// Vega-Lite selection functions.
expressionFunction('vlSelectionTest', vlSelectionTest, vlSelectionVisitor);
expressionFunction('vlSelectionResolve', vlSelectionResolve, vlSelectionVisitor);

// Deprecated selection functions kept around to avoid a major version bump.
expressionFunction('vlSingle', vlPoint, dataVisitor);
expressionFunction('vlSingleDomain', vlPointDomain, dataVisitor);
expressionFunction('vlMulti', vlPoint, vlMultiVisitor);
expressionFunction('vlMultiDomain', vlPointDomain, vlMultiVisitor);
expressionFunction('vlInterval', vlInterval, dataVisitor);
expressionFunction('vlIntervalDomain', vlIntervalDomain, dataVisitor);

// Build expression function registry
function buildFunctions(codegen) {
  var fn = functions(codegen);
  eventFunctions.forEach(function(name) { fn[name] = eventPrefix + name; });
  for (var name in functionContext) { fn[name] = thisPrefix + name; }
  return fn;
}

// Export code generator and parameters
export var codegenParams = {
  blacklist:  ['_'],
  whitelist:  ['datum', 'event', 'item'],
  fieldvar:   'datum',
  globalvar:  function(id) { return '_[' + stringValue('$' + id) + ']'; },
  functions:  buildFunctions,
  constants:  constants,
  visitors:   astVisitors
};

export var codeGenerator = codegen(codegenParams);

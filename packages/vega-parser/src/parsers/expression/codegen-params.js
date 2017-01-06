import {ASTNode, functions, constants} from 'vega-expression';
import {scaleGradient} from 'vega-scenegraph';
import {error, pad, stringValue, truncate} from 'vega-util';
import {rgb, lab, hcl, hsl} from 'd3-color';
import {indexPrefix, scalePrefix, tuplePrefix} from './prefixes';

import {
  format, utcFormat, timeFormat,
  monthFormat, monthAbbrevFormat,
  dayFormat, dayAbbrevFormat
} from './format';
import {quarter, utcquarter} from './quarter';
import {warn, info, debug} from './log';
import inScope from './inscope';
import clampRange from './clamp-range';
import {pinchDistance, pinchAngle} from './pinch';
import {open, screen, windowsize} from './window';
import span from './span';
import {range, domain, bandwidth, bandspace, copy, scale, invert} from './scale';
import tuples from './tuples';
import indata from './indata';
import inrange from './inrange';
import encode from './encode';
import modify from './modify';
import {vlPoint, vlInterval} from './selection';

var Literal = 'Literal',
    Identifier = 'Identifier',
    eventPrefix  = 'event.vega.',
    thisPrefix   = 'this.';

// Expression Functions

var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'];

var scaleFunctions = ['bandwidth', 'copy', 'domain', 'range', 'gradient', 'invert', 'scale'];

export var extendedFunctions = {
  gradient: scaleGradient,

  pad: pad,
  truncate: truncate,

  rgb: rgb,
  lab: lab,
  hcl: hcl,
  hsl: hsl,

  format: format,
  utcFormat: utcFormat,
  timeFormat: timeFormat,
  monthFormat: monthFormat,
  monthAbbrevFormat: monthAbbrevFormat,
  dayFormat: dayFormat,
  dayAbbrevFormat: dayAbbrevFormat,

  quarter: quarter,
  utcquarter: utcquarter,

  warn: warn,
  info: info,
  debug: debug,

  inScope: inScope,

  clampRange: clampRange,

  pinchDistance: pinchDistance,
  pinchAngle: pinchAngle,

  open: open,
  screen: screen,
  windowsize: windowsize,

  span: span,

  range: range,
  domain: domain,
  bandwidth: bandwidth,
  bandspace: bandspace,
  copy: copy,
  scale: scale,
  invert: invert,

  tuples: tuples,

  indata: indata,

  inrange: inrange,

  encode: encode,

  modify: modify,

  vlPoint: vlPoint,
  vlInterval: vlInterval
};

function expressionFunctions(codegen) {
  var fn = functions(codegen);
  eventFunctions.forEach(function(name) {
    fn[name] = eventPrefix + name;
  });
  for (var name in extendedFunctions) {
    fn[name] = thisPrefix + name;
  }
  return fn;
}

// AST visitors for dependency analysis

function scaleVisitor(name, args, scope, params) {
  if (args[0].type === Literal) { // scale dependency
    name = args[0].value;
    var scaleName = scalePrefix + name;

    if (!params.hasOwnProperty(scaleName)) {
      try {
        params[scaleName] = scope.scaleRef(name);
      } catch (err) {
        // TODO: error handling? warning?
      }
    }
  }

  else if (args[0].type === Identifier) { // forward reference to signal
    name = args[0].name;
    args[0] = new ASTNode(Literal);
    args[0].raw = '{signal:"' + name + '"}';
  }
}

function indataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to indata must be a string literal.');
  if (args[1].type !== Literal) error('Second argument to indata must be a string literal.');

  var data = args[0].value,
      field = args[1].value,
      indexName = indexPrefix + field;

  if (!params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field);
  }
}

function tuplesVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to tuples must be a string literal.');

  var data = args[0].value,
      dataName = tuplePrefix + data;

  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}

function visitors() {
  var v = {
    indata: indataVisitor,
    tuples: tuplesVisitor
  };
  scaleFunctions.forEach(function(_) {
    v[_] = scaleVisitor;
  });
  return v;
}

// Export code generator parameters
export default {
  blacklist:  ['_'],
  whitelist:  ['datum', 'event'],
  fieldvar:   'datum',
  globalvar:  function(id) { return '_[' + stringValue('$' + id) + ']'; },
  functions:  expressionFunctions,
  constants:  constants,
  visitors:   visitors()
};

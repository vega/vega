import parseDataflow from './dataflow';
import {parameterExpression, encodeExpression} from './expression';
import {accessor, compare, error, field, isObject} from 'vega-util';

/**
 * Parse a set of operator parameters.
 */
export default function parseParameters(spec, ctx, params) {
  params = params || {};
  var key, value;

  for (key in spec) {
    value = spec[key];

    if (value && value.$expr && value.$params) {
      // if expression, parse its parameters
      parseParameters(value.$params, ctx, params);
    }

    params[key] = Array.isArray(value)
      ? value.map(function(v) { return parseParameter(v, ctx); })
      : parseParameter(value, ctx);
  }
  return params;
}

/**
 * Parse a single parameter.
 */
function parseParameter(spec, ctx) {
  if (!spec || !isObject(spec)) return spec;

  for (var i=0, n=PARSERS.length, p; i<n; ++i) {
    p = PARSERS[i];
    if (spec.hasOwnProperty(p.key)) {
      return p.parse(spec, ctx);
    }
  }
  return spec;
}

/** Reference parsers. */
var PARSERS = [
  {key: '$ref',     parse: getOperator},
  {key: '$expr',    parse: getExpression},
  {key: '$field',   parse: getField},
  {key: '$encode',  parse: getEncode},
  {key: '$compare', parse: getCompare},
  {key: '$subflow', parse: getSubflow}
];

/**
 * Resolve an operator reference.
 */
function getOperator(_, ctx) {
  return ctx.get(_.$ref) || error('Operator not defined: ' + _.$ref);
}

/**
 * Resolve an expression reference.
 */
function getExpression(_, ctx) {
  var k = 'e:' + _.$expr;
  return ctx.fn[k]
    || (ctx.fn[k] = accessor(parameterExpression(_.$expr), _.$fields, _.$name));
}

/**
 * Resolve a field accessor reference.
 */
function getField(_, ctx) {
  var k = 'f:' + _.$field + '_' + _.$name;
  return ctx.fn[k]
    || (ctx.fn[k] = field(_.$field, _.$name));
}

/**
 * Resolve an encode operator reference.
 */
function getEncode(_) {
  var spec = _.$encode,
      encode = {}, name, enc;

  for (name in spec) {
    enc = spec[name];
    encode[name] = accessor(encodeExpression(enc.$expr), enc.$fields);
  }
  return encode;
}

/**
 * Resolve a comparator function reference.
 */
function getCompare(_, ctx) {
  var k = 'c:' + _.$compare + '_' + _.$order;
  return ctx.fn[k]
    || (ctx.fn[k] = compare(_.$compare, _.$order));
}

/**
 * Resolve a recursive subflow specification.
 */
function getSubflow(_, ctx) {
  var spec = _.$subflow;
  return function() {
    return parseDataflow(spec, ctx.fork()).get(spec.operators[0].id);
  };
}

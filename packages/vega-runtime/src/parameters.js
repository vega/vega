import parseDataflow from './dataflow';
import {parameterExpression, encodeExpression} from './expression';
import {tupleid} from 'vega-dataflow';
import {accessor, array, compare, error, field, isArray, isObject, hasOwnProperty, key} from 'vega-util';

/**
 * Parse a set of operator parameters.
 */
export default function parseParameters(spec, ctx, params) {
  params = params || {};
  let key;
  let value;

  for (key in spec) {
    value = spec[key];

    params[key] = isArray(value)
      ? value.map(function (v) {
          return parseParameter(v, ctx, params);
        })
      : parseParameter(value, ctx, params);
  }
  return params;
}

/**
 * Parse a single parameter.
 */
function parseParameter(spec, ctx, params) {
  if (!spec || !isObject(spec)) return spec;
  let p;
  for (let i = 0; i < PARSERS.length; ++i) {
    p = PARSERS[i];
    if (hasOwnProperty(spec, p.key)) {
      return p.parse(spec, ctx, params);
    }
  }
  return spec;
}

/** Reference parsers. */
const PARSERS = [
  {key: '$ref', parse: getOperator},
  {key: '$key', parse: getKey},
  {key: '$expr', parse: getExpression},
  {key: '$field', parse: getField},
  {key: '$encode', parse: getEncode},
  {key: '$compare', parse: getCompare},
  {key: '$context', parse: getContext},
  {key: '$subflow', parse: getSubflow},
  {key: '$tupleid', parse: getTupleId}
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
function getExpression(_, ctx, params) {
  if (_.$params) {
    // parse expression parameters
    parseParameters(_.$params, ctx, params);
  }
  const k = 'e:' + _.$expr + '_' + _.$name;
  return ctx.fn[k] || (ctx.fn[k] = accessor(parameterExpression(_.$expr, ctx), _.$fields, _.$name));
}

/**
 * Resolve a key accessor reference.
 */
function getKey(_, ctx) {
  const k = 'k:' + _.$key + '_' + !!_.$flat;
  return ctx.fn[k] || (ctx.fn[k] = key(_.$key, _.$flat));
}

/**
 * Resolve a field accessor reference.
 */
function getField(_, ctx) {
  if (!_.$field) return null;
  const k = 'f:' + _.$field + '_' + _.$name;
  return ctx.fn[k] || (ctx.fn[k] = field(_.$field, _.$name));
}

/**
 * Resolve a comparator function reference.
 */
function getCompare(_, ctx) {
  // As of Vega 5.5.3, $tupleid sort is no longer used.
  // Keep here for now for backwards compatibility.
  const k = 'c:' + _.$compare + '_' + _.$order;
  const c = array(_.$compare).map(function (_) {
    return _ && _.$tupleid ? tupleid : _;
  });
  return ctx.fn[k] || (ctx.fn[k] = compare(c, _.$order));
}

/**
 * Resolve an encode operator reference.
 */
function getEncode(_, ctx) {
  const spec = _.$encode;
  const encode = {};
  let name;
  let enc;

  for (name in spec) {
    enc = spec[name];
    encode[name] = accessor(encodeExpression(enc.$expr, ctx), enc.$fields);
    encode[name].output = enc.$output;
  }
  return encode;
}

/**
 * Resolve a context reference.
 */
function getContext(_, ctx) {
  return ctx;
}

/**
 * Resolve a recursive subflow specification.
 */
function getSubflow(_, ctx) {
  const spec = _.$subflow;
  return function (dataflow, key, parent) {
    const subctx = parseDataflow(spec, ctx.fork());
    const op = subctx.get(spec.operators[0].id);
    const p = subctx.signals.parent;
    if (p) p.set(parent);
    return op;
  };
}

/**
 * Resolve a tuple id reference.
 */
function getTupleId() {
  return tupleid;
}

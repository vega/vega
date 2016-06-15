import {
  isObject, accessor, field, compare
} from 'vega-dataflow';

import * as vega from 'vega-dataflow';

/**
 * Parse a serialized dataflow specification.
 */
export default function dataflow(spec, df) {
  df = df || new vega.Dataflow();

  var ctx = { operator: {}, fn: {} };
  spec.forEach(function(entry) {
    ctx.operator[entry.id] = parseOperator(entry, df, ctx);
  });

  return {
    dataflow: df,
    context: ctx
  }
}

/**
 * Parse a dataflow operator.
 */
function parseOperator(spec, df, ctx) {
  var op, fn, params;

  if (spec.type === 'Operator') {
    return df.add(spec.value);
  }

  if (spec.params) {
    params = parseParams(spec.params, ctx);
  }

  if (spec.type === 'Expression') {
    fn = Function('_', 'event', 'return ' + spec.value + ';');
    op = df.add(fn, params);
  } else {
    op = df.add(vega[spec.type], params);
    if (spec.type === 'Collect' && spec.value) {
      df.pulse(op, vega.changeset().insert(spec.value));
    }
  }
  return op;
}

/**
 * Parse a set of operator parameters.
 */
function parseParams(spec, ctx, params) {
  params = params || {};
  var key, value;

  for (key in spec) {
    value = spec[key];

    if (value && value.$expr && value.$params) {
      // if expression, parse its parameters
      parseParams(value.$params, ctx, params);
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
  {key: '$compare', parse: getCompare}
];

/**
 * Resolve an operator reference.
 */
function getOperator(_, ctx) {
  return ctx.operator[_.$ref];
}

/**
 * Resolve an expression reference.
 */
function getExpression(_, ctx) {
  var k = 'e:' + _.$expr;
  return ctx.fn[k] || (ctx.fn[k] =
    accessor(
      Function('datum', '_', 'return ' + _.$expr + ';'),
      _.$fields,
      _.$name
    )
  );
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
 * Resolve a comparator function reference.
 */
function getCompare(_, ctx) {
  var k = 'c:' + _.$compare + '_' + _.$order;
  return ctx.fn[k]
    || (ctx.fn[k] = compare(_.$compare, _.$order));
}

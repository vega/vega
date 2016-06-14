import * as dataflow from 'dataflow';

/**
 * Parse a serialized dataflow specification.
 */
export default function parse(spec, df) {
  var ctx = {
    operators: {},
    fields: {},
    exprs: {}
  };
  spec.forEach(function(entry) {
    ctx.operators[entry.id] = parseOperator(entry, df, ctx);
  });

  return ctx;
}

/**
 * Parse an operator.
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
    op = df.add(dataflow[spec.type], params);
    if (spec.type === 'Collect' && spec.value) {
      df.pulse(op, dataflow.changeset().insert(spec.value));
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

    if (isExpression(value) && value.$params) {
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
  return ctx.operators[_.$ref];
}

/**
 * Resolve an expression reference.
 */
function getExpression(_, ctx) {
  var k = 'e:' + _.$expr;
  return ctx.fields[k] || (ctx.fields[k] =
    dataflow.accessor(
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
  return ctx.fields[k]
    || (ctx.fields[k] = dataflow.field(_.$field, _.$name));
}

/**
 * Resolve a comparator function reference.
 */
function getCompare(_, ctx) {
  var k = 'c:' + _.$compare + '_' + _.$order;
  return ctx.fields[k]
    || (ctx.fields[k] = dataflow.compare(_.$compare, _.$order));
}

// ----

function isObject(_) {
  return _ === Object(_);
}

function isExpression(_) {
  return _ && _.$expr;
}

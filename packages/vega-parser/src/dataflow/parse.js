import * as dataflow from 'dataflow';

// Parse a serialized dataflow specification
export default function parse(spec, df) {
  var ctx = {
    operators: {},
    fields: {}
  };
  spec.forEach(function(entry) {
    ctx.operators[entry.id] = parseOperator(entry, df, ctx);
  });

  return ctx;
}

// Parse an operator
function parseOperator(spec, df, ctx) {
  var op, params = null;

  if (spec.type === 'Operator') {
    op = df.add(spec.value);
  } else {
    if (spec.params) {
      params = parseParams(spec.params, ctx);
    }
    op = df.add(dataflow[spec.type], params);
    if (spec.type === 'Collect' && spec.value) {
      df.pulse(op, dataflow.changeset().insert(spec.value));
    }
  }
  return op;
}

// Parse a set of operator parameters
function parseParams(spec, ctx) {
  var params = {}, key, value;
  for (key in spec) {
    value = spec[key];
    params[key] = Array.isArray(value)
      ? value.map(function(v) { return parseParameter(v, ctx); })
      : parseParameter(value, ctx);
  }
  return params;
}

// Parse a single parameter
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

// Operator and field reference parsers
var PARSERS = [
  {key: '$ref',     parse: getOperator},
  {key: '$field',   parse: getField},
  {key: '$compare', parse: getCompare}
];

function getOperator(_, ctx) {
  return ctx.operators[_.$ref];
}

function getField(_, ctx) {
  var k = _.$field + '_' + _.$name,
      f = ctx.fields[k];
  if (!f) ctx.fields[k] = (f = dataflow.field(_.$field, _.$name));
  return f;
}

function getCompare(_, ctx) {
  var k = _.$compare + '_' + _.$order,
      f = ctx.fields[k];
  if (!f) ctx.fields[k] = (f = dataflow.compare(_.$compare, _.$order));
  return f;
}

function isObject(_) {
  return _ === Object(_);
}

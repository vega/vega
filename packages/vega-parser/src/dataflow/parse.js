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
      return p.parse(spec[p.key], ctx);
    }
  }
  return spec;
}

// Operator and field reference parsers
var PARSERS = [
  {key: '$ref',   parse: getOperator},
  {key: '$field', parse: getField}
];

function getOperator(key, ctx) {
  return ctx.operators[key];
}

function getField(key, ctx) {
  var f = ctx.fields[key];
  if (!f) ctx.fields[key] = (f = dataflow.field(key));
  return f;
}

function isObject(_) {
  return _ === Object(_);
}

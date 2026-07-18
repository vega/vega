import {Params} from '../transforms.js';
import {entry, fieldRef, isSignal, ref} from '../util.js';
import {definition} from 'vega-dataflow';
import {parseExpression} from 'vega-functions';
import {error, extend, isArray, isString, stringValue} from 'vega-util';

/**
 * Parse a data transform specification.
 */
export default function(spec, scope) {
  const def = definition(spec.type);
  if (!def) error('Unrecognized transform type: ' + stringValue(spec.type));

  const t = entry(def.type.toLowerCase(), null, parseParameters(def, spec, scope));
  if (spec.signal) scope.addSignal(spec.signal, scope.proxy(t));
  t.metadata = def.metadata || {};

  return t;
}

/**
 * Parse all parameters of a data transform.
 */
function parseParameters(def, spec, scope) {
  const params = {},
        n = def.params.length;

  for (let i = 0; i < n; ++i) {
    const pdef = def.params[i];
    params[pdef.name] = parseParameter(pdef, spec, scope);
  }
  return params;
}

/**
 * Parse a data transform parameter.
 */
function parseParameter(def, spec, scope) {
  const type = def.type,
        value = spec[def.name];

  if (type === 'index') {
    return parseIndexParameter(def, spec, scope);
  } else if (value === undefined) {
    if (def.required) {
      error('Missing required ' + stringValue(spec.type)
          + ' parameter: ' + stringValue(def.name));
    }
    return;
  } else if (type === 'param') {
    return parseSubParameters(def, spec, scope);
  } else if (type === 'projection') {
    return scope.projectionRef(spec[def.name]);
  }

  return def.array && !isSignal(value)
    ? value.map(v => parameterValue(def, v, scope))
    : parameterValue(def, value, scope);
}

/**
 * Parse a single parameter value.
 */
function parameterValue(def, value, scope) {
  const type = def.type;

  if (isSignal(value)) {
    return isExpr(type) ? error('Expression references can not be signals.')
         : isField(type) ? scope.fieldRef(value)
         : isCompare(type) ? scope.compareRef(value)
         : scope.signalRef(value.signal);
  } else {
    const expr = def.expr || isField(type);
    return expr && outerExpr(value) ? scope.exprRef(value.expr, value.as)
         : expr && outerField(value) ? fieldRef(value.field, value.as)
         : isExpr(type) ? parseExpression(value, scope)
         : isData(type) ? ref(scope.getData(value).values)
         : isField(type) ? fieldRef(value)
         : isCompare(type) ? scope.compareRef(value)
         : value;
  }
}

/**
 * Parse parameter for accessing an index of another data set.
 */
function parseIndexParameter(def, spec, scope) {
  if (!isString(spec.from)) {
    error('Lookup "from" parameter must be a string literal.');
  }
  return scope.getData(spec.from).lookupRef(scope, spec.key);
}

/**
 * Parse a parameter that contains one or more sub-parameter objects.
 */
function parseSubParameters(def, spec, scope) {
  const value = spec[def.name];

  if (def.array) {
    if (!isArray(value)) { // signals not allowed!
      error('Expected an array of sub-parameters. Instead: ' + stringValue(value));
    }
    return value.map(v => parseSubParameter(def, v, scope));
  } else {
    return parseSubParameter(def, value, scope);
  }
}

/**
 * Parse a sub-parameter object.
 */
function parseSubParameter(def, value, scope) {
  const n =def.params.length;
  let pdef;

  // loop over defs to find matching key
  for (let i = 0; i < n; ++i) {
    pdef = def.params[i];
    for (const k in pdef.key) {
      if (pdef.key[k] !== value[k]) { pdef = null; break; }
    }
    if (pdef) break;
  }
  // raise error if matching key not found
  if (!pdef) error('Unsupported parameter: ' + stringValue(value));

  // parse params, create Params transform, return ref
  const params = extend(parseParameters(pdef, value, scope), pdef.key);
  return ref(scope.add(Params(params)));
}

// -- Utilities -----

export const outerExpr = _ => _ && _.expr;

export const outerField = _ => _ && _.field;

export const isData = _ => _ === 'data';

export const isExpr = _ => _ === 'expr';

export const isField = _ => _ === 'field';

export const isCompare = _ => _ === 'compare';

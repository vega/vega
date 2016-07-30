import parseExpression from './expression';
import {compareRef, fieldRef, isSignal, ref, transform} from '../util';
import {transformDef} from '../transforms';
import {error, extend, isArray, isString} from 'vega-util';

/**
 * Parse a data transform specification.
 */
export default function(spec, scope) {
  var def = transformDef(spec.type);
  var t = transform(def.type, parseParameters(def, spec, scope));
  if (spec.signal) scope.addSignal(spec.signal, t);
  return t.metadata = def.metadata || {}, t;
}

/**
 * Parse all parameters of a data transform.
 */
function parseParameters(def, spec, scope) {
  var params = {}, pdef, i, n;
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    params[pdef.name] = parseParameter(pdef, spec, scope);
  }
  return params;
}

/**
 * Parse a data transform parameter.
 */
function parseParameter(def, spec, scope) {
  var type = def.type, value;

  if (type === 'index') {
    return parseIndexParameter(def, spec, scope);
  } else if (type === 'param') {
    return parseSubParameters(def, spec, scope);
  } else if (type === 'projection') {
    return scope.projectionRef(spec[def.name]);
  } else {
    value = spec[def.name];
    if (value === undefined) {
      if (def.required) error('Missing required parameter: ' + def.name);
      return;
    }

    return def.array && !isSignal(value)
      ? value.map(function(v) {  return parameterValue(type, v, scope); })
      : parameterValue(type, value, scope);
  }
}

/**
 * Parse a single parameter value.
 */
function parameterValue(type, value, scope) {
  if (isSignal(value)) {
    return isData(type) ? error('Data references can not be signals.')
         : isExpr(type) ? error('Expression references can not be signals.')
         : isField(type) ? scope.fieldRef(value)
         : isCompare(type) ? scope.compareRef(value)
         : scope.signalRef(value.signal);
  } else {
    return isData(type) ? scope.getData(value).values
         : isExpr(type) ? parseExpression(value, scope)
         : isField(type) ? fieldRef(value)
         : isCompare(type) ? compareRef(value)
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
  return scope.getData(spec.from).lookupRef(spec.key);
}

/**
 * Parse a parameter that contains one or more sub-parameter objects.
 */
function parseSubParameters(def, spec, scope) {
  var value = spec[def.name];

  if (def.array) {
    if (!isArray(value)) { // signals not allowed!
      error('Expected an array of sub-parameters. Instead: ' + value);
    }
    return value.map(function(v) {
      return parseSubParameter(def, v, scope);
    });
  } else {
    return parseSubParameter(def, value, scope);
  }
}

/**
 * Parse a sub-parameter object.
 */
function parseSubParameter(def, value, scope) {
  var params, pdef, k, i, n;

  // loop over defs to find matching key
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    for (k in pdef.key) {
      if (pdef.key[k] !== value[k]) { pdef = null; break; }
    }
    if (pdef) break;
  }
  // raise error if matching key not found
  if (!pdef) error('Unsupported parameter: ' + JSON.stringify(value));

  // parse params, create Param transform, return ref
  params = extend(parseParameters(pdef, value, scope), pdef.key);
  return ref(scope.add(transform('Param', params)));
}

// -- Utilities -----

export function isData(_) {
  return _ === 'data';
}

export function isExpr(_) {
  return _ === 'expr';
}

export function isField(_) {
  return _ === 'field';
}

export function isCompare(_) {
  return _ === 'compare'
}

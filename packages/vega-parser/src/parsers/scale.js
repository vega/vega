import {transform, ref, keyFieldRef} from '../util';
import {error, isArray, isObject, isString, toSet} from 'vega-util';

export var scaleTypes = toSet([
  'identity', 'ordinal', 'band', 'point', 'index',
  'linear', 'log', 'pow', 'sqrt', 'sequential', 'time', 'utc',
  'quantize', 'quantile', 'threshold'
]);

export function isOrdinal(type) {
  return type === 'ordinal'
    || type === 'band'
    || type === 'point'
    || type === 'index';
}

export default function(spec, scope) {
  var type = spec.type || 'linear',
      params, key;

  if (!scaleTypes.hasOwnProperty(type)) {
    error('Unrecognized scale type: ' + type);
  }

  params = {
    type:   type,
    domain: parseScaleDomain(spec, scope)
  };

  if (spec.range != null) {
    if (spec.bandSize != null) {
      error('Scale range and bandSize are mutually exclusive.');
    }
    params.range = parseScaleRange(spec, scope);
  }

  for (key in spec) {
    if (params[key] || key === 'name') continue;
    params[key] = parseLiteral(spec[key], scope);
  }

  scope.addScale(spec.name, params);
}

function parseLiteral(v, scope) {
  return !isObject(v) ? v
    : v.signal ? scope.signalRef(v.signal)
    : error('Unsupported object: ' + v);
}

// -- SCALE DOMAIN ----

function parseScaleDomain(spec, scope) {
  var domain = spec.domain;
  if (!domain) error('Missing scale domain');

  if (domain.signal) {
    return scope.signalRef(domain.signal);
  }

  return (isArray(domain) ? explicitDomain
    : domain.fields ? multipleDomain
    : singularDomain)(spec, scope);
}

function explicitDomain(spec, scope) {
  return spec.domain.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function singularDomain(spec, scope) {
  var domain = spec.domain,
      data = scope.getData(domain.data);
  if (!data) error('Can not find data set: ' + domain.data);
  return isOrdinal(spec.type)
    ? data.valuesRef(domain.field, parseSort(domain.sort, false))
    : data.extentRef(domain.field);
}

function multipleDomain(spec, scope) {
  var method = isOrdinal(spec.type) ? oMultipleDomain : qMultipleDomain,
      data   = spec.domain.data,
      fields = spec.domain.fields.reduce(function(dom, d) {
        return dom.push(isString(d) ? {data: data, field:d} : d), dom;
      }, []);
  return method(spec, scope, fields);
}

function oMultipleDomain(spec, scope, fields) {
  var counts, a, c, v;

  // get value counts for each domain field
  counts = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) error('Can not find data set: ' + f.data);
    return data.countsRef(f.field);
  });

  // sum counts from all fields
  a = scope.add(transform('Aggregate', {
    groupby: keyFieldRef,
    ops:['sum'], fields: [scope.fieldRef('count')], as:['count'],
    pulse: counts
  }));

  // collect aggregate output
  c = scope.add(transform('Collect', {pulse: ref(a)}));

  // extract values for combined domain
  v = scope.add(transform('Values', {
    field: keyFieldRef,
    sort:  scope.sortRef(parseSort(spec.domain.sort, true)),
    pulse: ref(c)
  }));

  return ref(v);
}

function parseSort(sort, multidomain) {
  if (sort) {
    if (!sort.op && !sort.field) {
      sort.field = 'key';
    } else if (multidomain && sort.field) {
      error('Multiple domain scales can not sort by field.');
    } else if (multidomain && sort.op && sort.op !== 'count') {
      error('Multiple domain scales support op count only.');
    }
  }
  return sort;
}

function qMultipleDomain(spec, scope, fields) {
  // get extents for each domain field
  var extents = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) error('Can not find data set: ' + f.data);
    return data.extentRef(f.field);
  });

  // combine extents
  return ref(scope.add(transform('MultiExtent', {extents: extents})));
}

// -- SCALE RANGE -----

function parseScaleRange(spec, scope) {
  var range = spec.range;

  if (range.signal) {
    return scope.signalRef(range.signal);
  } else if (range === 'width') {
    range = [0, {'signal': 'width'}];
  } else if (range === 'height') {
    range = [{'signal': 'height'}, 0];
  } else if (!isArray(range)) {
    error('Unsupported range type: ' + range);
  }

  return range.map(function(v) {
    return parseLiteral(v, scope);
  });
}

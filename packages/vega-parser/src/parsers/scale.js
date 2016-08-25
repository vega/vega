import {ref, keyFieldRef} from '../util';
import {Collect, Aggregate, MultiExtent, MultiValues, Values} from '../transforms';
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

export function isQuantile(type) {
  return type === 'quantile';
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
  if (!domain) return; // default domain

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
      : isQuantile(spec.type) ? data.domainRef(domain.field)
      : data.extentRef(domain.field);
}

function multipleDomain(spec, scope) {
  var data = spec.domain.data,
      fields = spec.domain.fields.reduce(function(dom, d) {
        return dom.push(isString(d) ? {data: data, field:d} : d), dom;
      }, []);

  return (isOrdinal(spec.type) ? ordinalMultipleDomain
    : isQuantile(spec.type) ? quantileMultipleDomain
    : numericMultipleDomain)(spec, scope, fields);
}

function ordinalMultipleDomain(spec, scope, fields) {
  var counts, a, c, v;

  // get value counts for each domain field
  counts = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) error('Can not find data set: ' + f.data);
    return data.countsRef(f.field);
  });

  // sum counts from all fields
  a = scope.add(Aggregate({
    groupby: keyFieldRef,
    ops:['sum'], fields: [scope.fieldRef('count')], as:['count'],
    pulse: counts
  }));

  // collect aggregate output
  c = scope.add(Collect({pulse: ref(a)}));

  // extract values for combined domain
  v = scope.add(Values({
    field: keyFieldRef,
    sort:  scope.sortRef(parseSort(spec.domain.sort, true)),
    pulse: ref(c)
  }));

  return ref(v);
}

function parseSort(sort, multidomain) {
  if (sort) {
    if (!sort.field && !sort.op) {
      if (isObject(sort)) sort.field = 'key';
      else sort = {field: 'key'};
    } else if (!sort.field && sort.op !== 'count') {
      error('No field provided for sort aggregate op: ' + sort.op);
    } else if (multidomain && sort.field) {
      error('Multiple domain scales can not sort by field.');
    } else if (multidomain && sort.op && sort.op !== 'count') {
      error('Multiple domain scales support op count only.');
    }
  }
  return sort;
}

function quantileMultipleDomain(spec, scope, fields) {
  // get value arrays for each domain field
  var values = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) error('Can not find data set: ' + f.data);
    return data.domainRef(f.field);
  });

  // combine value arrays
  return ref(scope.add(MultiValues({values: values})));
}

function numericMultipleDomain(spec, scope, fields) {
  // get extents for each domain field
  var extents = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) error('Can not find data set: ' + f.data);
    return data.extentRef(f.field);
  });

  // combine extents
  return ref(scope.add(MultiExtent({extents: extents})));
}

// -- SCALE RANGE -----

function parseScaleRange(spec, scope) {
  var range = spec.range,
      config = scope.config.range;

  if (range.signal) {
    return scope.signalRef(range.signal);
  } else if (isString(range)) {
    if (config && config.hasOwnProperty(range)) {
      range = config[range];
    } else {
      error('Unrecognized scale range value: ' + range);
    }
  } else if (!isArray(range)) {
    error('Unsupported range type: ' + range);
  }

  return range.map(function(v) {
    return parseLiteral(v, scope);
  });
}

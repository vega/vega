import {ref, keyFieldRef} from '../util';
import {Collect, Aggregate, MultiExtent, MultiValues, Values} from '../transforms';
import {error, isArray, isObject, isString, stringValue, toSet} from 'vega-util';

var types = [
  'identity',
  'ordinal', 'band', 'point', 'index',
  'linear', 'pow', 'sqrt', 'log', 'sequential',
  'time', 'utc',
  'quantize', 'quantile', 'threshold'
]

var allTypes = toSet(types),
    ordinalTypes = toSet(types.slice(1, 5));

export function isOrdinal(type) {
  return ordinalTypes.hasOwnProperty(type);
}

export function isQuantile(type) {
  return type === 'quantile';
}

export default function(spec, scope) {
  var type = spec.type || 'linear',
      params, key;

  if (!allTypes.hasOwnProperty(type)) {
    error('Unrecognized scale type: ' + stringValue(type));
  }

  params = {
    type:   type,
    domain: parseScaleDomain(spec.domain, spec, scope)
  };

  if (spec.range != null) {
    if (spec.rangeStep != null) {
      error('Scale range and rangeStep are mutually exclusive.');
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
    : error('Unsupported object: ' + stringValue(v));
}

function dataLookupError(name) {
  error('Can not find data set: ' + stringValue(name));
}

// -- SCALE DOMAIN ----

function parseScaleDomain(domain, spec, scope) {
  if (!domain) {
    if (spec.domainMin != null || spec.domainMax != null) {
      error('No scale domain defined for domainMin/domainMax to override.');
    }
    return; // default domain
  }

  if (domain.signal) {
    return scope.signalRef(domain.signal);
  }

  return (isArray(domain) ? explicitDomain
    : domain.fields ? multipleDomain
    : singularDomain)(domain, spec, scope);
}

function explicitDomain(domain, spec, scope) {
  return domain.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function singularDomain(domain, spec, scope) {
  var data = scope.getData(domain.data);
  if (!data) dataLookupError(domain.data);

  return isOrdinal(spec.type)
      ? data.valuesRef(scope, domain.field, parseSort(domain.sort, false))
      : isQuantile(spec.type) ? data.domainRef(scope, domain.field)
      : data.extentRef(scope, domain.field);
}

function multipleDomain(domain, spec, scope) {
  var data = domain.data,
      fields = domain.fields.reduce(function(dom, d) {
        return dom.push(isString(d) ? {data: data, field: d} : d), dom;
      }, []);

  return (isOrdinal(spec.type) ? ordinalMultipleDomain
    : isQuantile(spec.type) ? quantileMultipleDomain
    : numericMultipleDomain)(domain, scope, fields);
}

function ordinalMultipleDomain(domain, scope, fields) {
  var counts, a, c, v;

  // get value counts for each domain field
  counts = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.countsRef(scope, f.field);
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
    sort:  scope.sortRef(parseSort(domain.sort, true)),
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

function quantileMultipleDomain(domain, scope, fields) {
  // get value arrays for each domain field
  var values = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.domainRef(scope, f.field);
  });

  // combine value arrays
  return ref(scope.add(MultiValues({values: values})));
}

function numericMultipleDomain(domain, scope, fields) {
  // get extents for each domain field
  var extents = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.extentRef(scope, f.field);
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
    } else if (range === 'width') {
      range = [0, {signal: 'width'}]
    } else if (range === 'height') {
      range = isOrdinal(spec.type)
        ? [0, {signal: 'height'}]
        : [{signal: 'height'}, 0]
    } else {
      error('Unrecognized scale range value: ' + stringValue(range));
    }
  } else if (isOrdinal(spec.type) && !isArray(range)) {
    return parseScaleDomain(range, spec, scope);
  } else if (!isArray(range)) {
    error('Unsupported range type: ' + stringValue(range));
  }

  return range.map(function(v) {
    return parseLiteral(v, scope);
  });
}

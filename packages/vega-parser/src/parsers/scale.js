import {error, transform, ref, keyRef} from '../util';
import {extend, isArray, isObject, isString, toSet} from 'vega-util';

export var scaleTypes = toSet([
  'identity', 'ordinal', 'band', 'point',
  'linear', 'log', 'pow', 'sqrt', 'sequential', 'time', 'utc',
  'quantize', 'quantile', 'threshold'
]);

export function isOrdinal(type) {
  return type === 'ordinal' || type === 'band' || type === 'point';
}

export default function parseScale(scale, scope) {
  var type = scale.type || 'linear';
  if (!scaleTypes.hasOwnProperty(type)) error ('Unrecognized scale type: ' + type);

  var params = extend({}, scale);
  delete params.name;
  params.type = type;
  params.domain = parseScaleDomain(scale, scope);
  params.range = parseScaleRange(scale, scope);

  scope.addScale(scale.name, params);
}

function parseLiteral(v, scope) {
  return !isObject(v) ? v
    : v.signal ? scope.signalRef(v.signal)
    : error('Unsupported object: ' + v);
}

// -- SCALE DOMAIN ----

function parseScaleDomain(scale, scope) {
  var domain = scale.domain;
  if (!domain) error('Missing scale domain');

  return (isArray(domain) ? explicitDomain
    : domain.fields ? multipleDomain
    : singularDomain)(scale, scope);
}

function explicitDomain(scale, scope) {
  return scale.domain.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function singularDomain(scale, scope) {
  var domain = scale.domain,
      data = scope.getData(domain.data);
  if (!data) error('Can not find data set: ' + domain.data);
  return isOrdinal(scale.type)
    ? data.valuesRef(domain.field, parseSort(domain.sort, false))
    : data.extentRef(domain.field);
}

function multipleDomain(scale, scope) {
  var method = isOrdinal(scale.type) ? oMultipleDomain : qMultipleDomain,
      data   = scale.domain.data,
      fields = scale.domain.fields.reduce(function(dom, d) {
        return dom.push(isString(d) ? {data: data, field:d} : d), dom;
      }, []);
  return method(scale, scope, fields);
}

function oMultipleDomain(scale, scope, fields) {
  var counts, a, c, v;

  // get value counts for each domain field
  counts = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) error('Can not find data set: ' + f.data);
    return data.countsRef(f.field);
  });

  // sum counts from all fields
  a = scope.add(transform('Aggregate', {
    groupby: keyRef,
    ops:['sum'], fields: [scope.fieldRef('count')], as:['count'],
    pulse: counts
  }));

  // collect aggregate output
  c = scope.add(transform('Collect', {pulse: ref(a)}));

  // extract values for combined domain
  v = scope.add(transform('Values', {
    field: keyRef,
    sort:  scope.sortRef(parseSort(scale.domain.sort, true)),
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

function qMultipleDomain(scale, scope, fields) {
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

function parseScaleRange(scale, scope) {
  if (!scale.range) error('Missing scale range');
  var range = scale.range;

  if (range === 'WIDTH') {
    range = [0, {'signal': 'width'}];
  } else if (range === 'HEIGHT') {
    range = [{'signal': 'height'}, 0];
  } else if (!isArray(range)) {
    error('Unsupported range type: ' + range);
  }

  return range.map(function(v) {
    return parseLiteral(v, scope);
  });
}

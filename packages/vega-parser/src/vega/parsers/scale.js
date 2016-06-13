import {
  error,
  isObject, isArray, isString,
  transform, ref, keyRef
} from '../util';

export default function parseScale(scale, scope) {
  var type = scale.type, // TODO check for valid type?
      params = {type: type};

  params.domain = parseScaleDomain(scale, scope);
  params.range = parseScaleRange(scale, scope);
  // TODO: loop over remaining legal params; add to hash...

  scope.addScale(scale.name, params);
}

function isDiscrete(type) {
  return type === 'ordinal' || type === 'band' || type === 'point';
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

  return isArray(domain) ? explicitDomain(scale, scope)
    : domain.fields ? multipleDomain(scale, scope)
    : singularDomain(scale, scope);
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
  return isDiscrete(scale.type)
    ? data.valuesRef(domain.field, parseSort(domain.sort))
    : data.extentRef(domain.field);
}

function multipleDomain(scale, scope) {
  var method = isDiscrete(scale.type) ? oMultipleDomain : qMultipleDomain,
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
    sort:  scope.sortRef(parseSort(scale.domain.sort)),
    pulse: ref(c)
  }));

  return ref(v);
}

function parseSort(sort) {
  if (sort && !sort.op && !sort.field) sort.field = 'key';
  return sort;
}

function qMultipleDomain(/*scale, scope, fields*/) {
  throw Error('Not yet supported.');
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

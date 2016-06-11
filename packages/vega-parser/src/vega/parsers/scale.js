import {error, isObject, isArray, transform, ref, keyRef} from '../util';

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
  if (!scale.domain) error('Missing scale domain');
  var domain = standardizeDomain(scale.domain);

  return domain.length > 1
    ? multipleDomain(domain, scale, scope)
    : isArray(domain = domain[0])
      ? explicitDomain(domain, scope)
      : singularDomain(domain, scale, scope);
}

function explicitDomain(domain, scope) {
  return domain.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function singularDomain(domain, scale, scope) {
  var data = scope.getData(domain.data);
  if (!data) error('Can not find data set: ' + domain.data);
  return isDiscrete(scale.type)
    ? data.valuesRef(domain.field)
    : data.extentRef(domain.field);
}

function multipleDomain(domain, scale, scope) {
  return isDiscrete(scale.type)
    ? oMultipleDomain(domain, scale, scope)
    : qMultipleDomain(domain, scale, scope);
}

function oMultipleDomain(domain, scale, scope) {
  var counts, a, c, v;

  // get value counts for each domain field
  counts = domain.map(function(d) {
    var data = scope.getData(d.data);
    if (!data) error('Can not find data set: ' + d.data);
    return data.countsRef(d.field);
  });

  // sum counts from all fields
  a = scope.add(transform('Aggregate', {
    groupby: keyRef,
    ops:['sum'], fields: [scope.fieldRef('count')], as:['count'],
    pulse: counts
  }));

  // collect aggregate output; TODO: sort?
  c = scope.add(transform('Collect', {pulse: ref(a)}));

  // extract values for combined domain
  v = scope.add(transform('Values', {field: keyRef, pulse: ref(c)}));

  return ref(v);
}

function qMultipleDomain(/*domain, scale, scope*/) {
  throw Error('Not yet supported.');
}

// Standardize a potentially multi-domain or multi-field specification
// into an array of stand-alone domain specifications.
function standardizeDomain(domain) {
  var a = isArray(domain);

  if (a && isObject(domain[0])) {
    // multi-domain spec: recursively standardize
    return domain.reduce(function(dom, d) {
      if (isArray(d)) error('Scale domain can not have nested arrays.');
      return dom.push.apply(dom, standardizeDomain(d)), dom;
    }, []);
  } else if (!a && isArray(domain.field)) {
    // multi-field spec: map to multi-domain format
    return domain.field.map(function(f) {
      return {data: domain.data, field: f};
    });
  } else {
    // otherwise nothing to do, return
    return [domain];
  }
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

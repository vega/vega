import {
  Aggregate, Collect, MultiExtent, MultiValues, Sieve, Values
} from '../transforms.js';
import {aggrField, keyFieldRef, ref} from '../util.js';

import {isDiscrete, isQuantile, isValidScaleType} from 'vega-scale';
import {
  error, extend, hasOwnProperty, isArray, isObject, isString, stringValue
} from 'vega-util';

let FIELD_REF_ID = 0;

const MULTIDOMAIN_SORT_OPS  = {min: 'min', max: 'max', count: 'sum'};

export function initScale(spec, scope) {
  const type = spec.type || 'linear';

  if (!isValidScaleType(type)) {
    error('Unrecognized scale type: ' + stringValue(type));
  }

  scope.addScale(spec.name, {
    type,
    domain: undefined
  });
}

export function parseScale(spec, scope) {
  const params = scope.getScale(spec.name).params;
  let key;

  params.domain = parseScaleDomain(spec.domain, spec, scope);

  if (spec.range != null) {
    params.range = parseScaleRange(spec, scope, params);
  }

  if (spec.interpolate != null) {
    parseScaleInterpolate(spec.interpolate, params);
  }

  if (spec.nice != null) {
    params.nice = parseScaleNice(spec.nice, scope);
  }

  if (spec.bins != null) {
    params.bins = parseScaleBins(spec.bins, scope);
  }

  for (key in spec) {
    if (hasOwnProperty(params, key) || key === 'name') continue;
    params[key] = parseLiteral(spec[key], scope);
  }
}

function parseLiteral(v, scope) {
  return !isObject(v) ? v
    : v.signal ? scope.signalRef(v.signal)
    : error('Unsupported object: ' + stringValue(v));
}

function parseArray(v, scope) {
  return v.signal
    ? scope.signalRef(v.signal)
    : v.map(v => parseLiteral(v, scope));
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

  return domain.signal ? scope.signalRef(domain.signal)
    : (isArray(domain) ? explicitDomain
    : domain.fields ? multipleDomain
    : singularDomain)(domain, spec, scope);
}

function explicitDomain(domain, spec, scope) {
  return domain.map(v => parseLiteral(v, scope));
}

function singularDomain(domain, spec, scope) {
  const data = scope.getData(domain.data);
  if (!data) dataLookupError(domain.data);

  return isDiscrete(spec.type)
      ? data.valuesRef(scope, domain.field, parseSort(domain.sort, false))
      : isQuantile(spec.type) ? data.domainRef(scope, domain.field)
      : data.extentRef(scope, domain.field);
}

function multipleDomain(domain, spec, scope) {
  const data = domain.data,
        fields = domain.fields.reduce((dom, d) => {
          d = isString(d) ? {data: data, field: d}
            : (isArray(d) || d.signal) ? fieldRef(d, scope)
            : d;
          dom.push(d);
          return dom;
        }, []);

  return (isDiscrete(spec.type) ? ordinalMultipleDomain
    : isQuantile(spec.type) ? quantileMultipleDomain
    : numericMultipleDomain)(domain, scope, fields);
}

function fieldRef(data, scope) {
  const name = '_:vega:_' + (FIELD_REF_ID++),
        coll = Collect({});

  if (isArray(data)) {
    coll.value = {$ingest: data};
  } else if (data.signal) {
    const code = 'setdata(' + stringValue(name) + ',' + data.signal + ')';
    coll.params.input = scope.signalRef(code);
  }
  scope.addDataPipeline(name, [coll, Sieve({})]);
  return {data: name, field: 'data'};
}

function ordinalMultipleDomain(domain, scope, fields) {
  const sort = parseSort(domain.sort, true);
  let a, v;

  // get value counts for each domain field
  const counts = fields.map(f => {
    const data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.countsRef(scope, f.field, sort);
  });

  // aggregate the results from each domain field
  const p = {groupby: keyFieldRef, pulse: counts};
  if (sort) {
    a = sort.op || 'count';
    v = sort.field ? aggrField(a, sort.field) : 'count';
    p.ops = [MULTIDOMAIN_SORT_OPS[a]];
    p.fields = [scope.fieldRef(v)];
    p.as = [v];
  }
  a = scope.add(Aggregate(p));

  // collect aggregate output
  const c = scope.add(Collect({pulse: ref(a)}));

  // extract values for combined domain
  v = scope.add(Values({
    field: keyFieldRef,
    sort:  scope.sortRef(sort),
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
      if (sort.op && !MULTIDOMAIN_SORT_OPS[sort.op]) {
        error('Multiple domain scales can not be sorted using ' + sort.op);
      }
    }
  }
  return sort;
}

function quantileMultipleDomain(domain, scope, fields) {
  // get value arrays for each domain field
  const values = fields.map(f => {
    const data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.domainRef(scope, f.field);
  });

  // combine value arrays
  return ref(scope.add(MultiValues({values: values})));
}

function numericMultipleDomain(domain, scope, fields) {
  // get extents for each domain field
  const extents = fields.map(f => {
    const data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.extentRef(scope, f.field);
  });

  // combine extents
  return ref(scope.add(MultiExtent({extents: extents})));
}

// -- SCALE BINS -----

function parseScaleBins(v, scope) {
  return v.signal || isArray(v)
    ? parseArray(v, scope)
    : scope.objectProperty(v);
}

// -- SCALE NICE -----

function parseScaleNice(nice, scope) {
  return nice.signal
    ? scope.signalRef(nice.signal)
    : isObject(nice)
    ? {
        interval: parseLiteral(nice.interval),
        step: parseLiteral(nice.step)
      }
    : parseLiteral(nice);
}

// -- SCALE INTERPOLATION -----

function parseScaleInterpolate(interpolate, params) {
  params.interpolate = parseLiteral(interpolate.type || interpolate);
  if (interpolate.gamma != null) {
    params.interpolateGamma = parseLiteral(interpolate.gamma);
  }
}

// -- SCALE RANGE -----

function parseScaleRange(spec, scope, params) {
  const config = scope.config.range;
  let range = spec.range;

  if (range.signal) {
    return scope.signalRef(range.signal);
  } else if (isString(range)) {
    if (config && hasOwnProperty(config, range)) {
      spec = extend({}, spec, {range: config[range]});
      return parseScaleRange(spec, scope, params);
    } else if (range === 'width') {
      range = [0, {signal: 'width'}];
    } else if (range === 'height') {
      range = isDiscrete(spec.type)
        ? [0, {signal: 'height'}]
        : [{signal: 'height'}, 0];
    } else {
      error('Unrecognized scale range value: ' + stringValue(range));
    }
  } else if (range.scheme) {
    params.scheme = isArray(range.scheme)
      ? parseArray(range.scheme, scope)
      : parseLiteral(range.scheme, scope);
    if (range.extent) params.schemeExtent = parseArray(range.extent, scope);
    if (range.count) params.schemeCount = parseLiteral(range.count, scope);
    return;
  } else if (range.step) {
    params.rangeStep = parseLiteral(range.step, scope);
    return;
  } else if (isDiscrete(spec.type) && !isArray(range)) {
    return parseScaleDomain(range, spec, scope);
  } else if (!isArray(range)) {
    error('Unsupported range type: ' + stringValue(range));
  }

  return range.map(v => (isArray(v) ? parseArray : parseLiteral)(v, scope));
}

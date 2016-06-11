import {error, isObject} from '../util';

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

function parseScaleDomain(scale, scope) {
  if (!scale.domain) error('Missing scale domain');
  var domain = scale.domain;

  if (Array.isArray(domain)) {
    // TODO: multi-domain support
    return domain.map(function(v) {
      return parseLiteral(v, scope);
    });
  }

  var data = scope.getData(domain.data);
  if (!data) {
    error('Can not find data set: ' + domain.data);
  }
  return isDiscrete(scale.type)
    ? data.valuesRef(domain.field)
    : data.extentRef(domain.field);
}

function parseScaleRange(scale, scope) {
  if (!scale.range) error('Missing scale range');
  var range = scale.range;

  if (range === 'WIDTH') {
    range = [0, {'signal': 'width'}];
  } else if (range === 'HEIGHT') {
    range = [{'signal': 'height'}, 0];
  } else if (!Array.isArray(range)) {
    error('Unsupported range type: ' + range);
  }

  return range.map(function(v) {
    return parseLiteral(v, scope);
  });
}

import {error, isArray, isObject, stringValue} from 'vega-util';

export default function(proj, scope) {
  var params = {};

  for (var name in proj) {
    if (name === 'name') continue;
    params[name] = parseParameter(proj[name], scope);
  }

  scope.addProjection(proj.name, params);
}

function parseParameter(_, scope) {
  return isArray(_) ? _.map(function(_) { return parseParameter(_, scope); })
    : !isObject(_) ? _
    : _.signal ? scope.signalRef(_.signal)
    : error('Unsupported parameter object: ' + stringValue(_));
}

import {error, isArray, isObject} from 'vega-util';

export default function(proj, scope) {
  var params = {
    type: proj.type || 'mercator'
  };

  for (var name in proj) {
    if (name === 'name' || name === 'type') continue;
    params[name] = parseParameter(proj[name], scope);
  }

  scope.addProjection(proj.name, params);
}

function parseParameter(_, scope) {
  return isArray(_) ? _.map(function(_) { return parseParameter(_, scope); })
    : !isObject(_) ? _
    : _.signal ? scope.signalRef(_.signal)
    : error('Unsupported parameter object: ' + JSON.stringify(_));
}

import {error, isArray, isObject, stringValue} from 'vega-util';

export default function(proj, scope) {
  const config = scope.config.projection || {},
        params = {};

  for (const name in proj) {
    if (name === 'name') continue;
    params[name] = parseParameter(proj[name], name, scope);
  }

  // apply projection defaults from config
  for (const name in config) {
    if (params[name] == null) {
      params[name] = parseParameter(config[name], name, scope);
    }
  }

  scope.addProjection(proj.name, params);
}

function parseParameter(_, name, scope) {
  return isArray(_) ? _.map(_ => parseParameter(_, name, scope))
    : !isObject(_) ? _
    : _.signal ? scope.signalRef(_.signal)
    : name === 'fit' ? _
    : error('Unsupported parameter object: ' + stringValue(_));
}

import {error, isArray, isObject, stringValue} from 'vega-util';

export default function(proj, scope) {
  const config = scope.config.projection || {},
        params = {};

  for (const name in proj) {
    if (name === 'name') continue;
    params[name] = parseParameter(proj[name], name, scope, proj);
  }

  // apply projection defaults from config
  for (const name in config) {
    if (params[name] == null) {
      params[name] = parseParameter(config[name], name, scope, proj);
    }
  }

  scope.addProjection(proj.name, params, proj);
}

function parseParameter(_, name, scope, src) {
  return isArray(_) ? _.map(_ => parseParameter(_, name, scope, src))
    : !isObject(_) ? _
    : _.signal ? scope.signalRef(_.signal)
    : name === 'fit' ? _
    : error('Unsupported parameter object: ' + stringValue(_));
}

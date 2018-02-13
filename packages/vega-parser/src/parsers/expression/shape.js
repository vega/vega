import {getScale} from './scale';
import {pathParse, pathRender} from 'vega-scenegraph';

export function geoShape(projection, geojson, group) {
  var p = getScale(projection, (group || this).context);
  return function(context) {
    return p ? p.path.context(context)(geojson) : '';
  }
}

export function pathShape(path) {
  var p = null;
  return function(context) {
    return context
      ? pathRender(context, (p = p || pathParse(path)))
      : path;
  };
}

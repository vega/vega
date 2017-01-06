import {getScale} from './scale';

function geoMethod(method) {
  return function(projection, geojson, group) {
    var p = getScale(projection, (group || this).context);
    return p && p.path[method](geojson);
  };
}

export var geoArea = geoMethod('area');
export var geoBounds = geoMethod('bounds');
export var geoCentroid = geoMethod('centroid');

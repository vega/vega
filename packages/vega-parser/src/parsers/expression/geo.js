import {
  geoArea as area,
  geoBounds as bounds,
  geoCentroid as centroid
} from 'd3-geo';
import {getScale} from './scale';

function geoMethod(methodName, globalMethod) {
  return function(projection, geojson, group) {
    if (projection) {
      // projection defined, use it
      var p = getScale(projection, (group || this).context);
      return p && p.path[methodName](geojson);
    } else {
      // projection undefined, use global method
      return globalMethod(geojson);
    }
  };
}

export var geoArea = geoMethod('area', area);
export var geoBounds = geoMethod('bounds', bounds);
export var geoCentroid = geoMethod('centroid', centroid);

import {Transform} from 'vega-dataflow';
import {error, inherits, isArray} from 'vega-util';

/**
 * Convert an array of longitude/latitude points or the collection of the specified field
 * into GeoJSON for use in a projection's fit argument.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.fields - A two-element array of
 *   field accessors for the longitude and latitude values.
 */
export default function GeoJSON(params) {
  Transform.call(this, null, params);
}

export function collectGeoJSON(features) {
  return !isArray(features) ? features
    : features.length > 1 ? {type: 'FeatureCollection', features: features}
    : features[0];
}

GeoJSON.Definition = {
  "type": "GeoJSON",
  "metadata": {},
  "params": [
    { "name": "fields", "type": "field", "array": true, "length": 2 },
    { "name": "geojson", "type": "field" },
  ]
};

var prototype = inherits(GeoJSON, Transform);

prototype.transform = function(_, pulse) {
  var fields = _.fields,
      lon = fields[0],
      lat = fields[1],
      geojson = _.geojson,
      flag = pulse.ADD,
      features = [],
      points = [],
      mod;

  if (!_.geojson && !_.fields) {
    error('The GeoJSON requires either longitude and latitude to be specified with the fields argument or a field containing GeoJSON data to be specified with the GeoJSON argument, or both.')
  } else if (!lon != !lat) {
    error('Missing longitude or latitude - the fields argument must contain both the longitude and latitude, in that order');
  }

  mod = pulse.changed()
    || (geojson && (_.modified('geojson') || pulse.modified(geojson.fields)))
    || (lon && (_.modified('lon') || pulse.modified(lon.fields)))
    || (lat && (_.modified('lat') || pulse.modified(lat.fields)));

  if (mod) {
    flag = pulse.SOURCE;
    features = [];
    points = [];
  }

  pulse.visit(flag, function (t) {
    if (geojson) {
      features.push(geojson(t));
    }
    if (lon && lat) {
      var longitude = parseFloat(lon(t)),
          latitude = parseFloat(lat(t));
      if (isNaN(longitude) || isNaN(latitude)) {
        error('Some row contains an invalid longitude or latitude');
      } else {
        points.push([longitude, latitude]);
      }
    }
  });

  if (points.length > 0) {
    features.push({
      "type": "MultiPoint",
      "coordinates": points
    })
  }

  this.value = collectGeoJSON(features);
};

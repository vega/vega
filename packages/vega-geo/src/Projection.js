import {Transform} from 'vega-dataflow';
import {projection, projectionProperties} from 'vega-projection';
import {error, inherits, isArray, isFunction} from 'vega-util';

/**
 * Maintains a cartographic projection.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
export default function Projection(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype = inherits(Projection, Transform);

prototype.transform = function(_, pulse) {
  var proj = this.value;

  if (!proj || _.modified('type')) {
    this.value = (proj = create(_.type));
    projectionProperties.forEach(function(prop) {
      if (_[prop] != null) set(proj, prop, _[prop]);
    });
  } else {
    projectionProperties.forEach(function(prop) {
      if (_.modified(prop)) set(proj, prop, _[prop]);
    });
  }

  if (_.pointRadius != null) proj.path.pointRadius(_.pointRadius);
  if (_.fit) fit(proj, _);

  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};

function fit(proj, _) {
  var data = geoJSON(_.fit);
  _.extent ? proj.fitExtent(_.extent, data)
    : _.size ? proj.fitSize(_.size, data) : 0;
}

function geoJSON(data) {
  return !isArray(data) ? data
    : data.length > 1 ? {type: 'FeatureCollection', features: data}
    : data[0];
}

function create(type) {
  var constructor = projection((type || 'mercator').toLowerCase());
  if (!constructor) error('Unrecognized projection type: ' + type);
  return constructor();
}

function set(proj, key, value) {
   if (isFunction(proj[key])) proj[key](value);
}
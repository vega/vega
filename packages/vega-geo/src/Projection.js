import {Transform} from 'vega-dataflow';
import {error, inherits, isFunction} from 'vega-util';
import {projection, properties} from './projections';

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

prototype.transform = function(_) {
  var proj = this.value;

  if (!proj || _.modified('type')) {
    this.value = (proj = create(_.type));
    properties.forEach(function(prop) {
      if (_[prop] != null) set(proj, prop, _[prop]);
    });
  } else {
    properties.forEach(function(prop) {
      if (_.modified(prop)) set(proj, prop, _[prop]);
    });
  }

  if (_.pointRadius != null) proj.path.pointRadius(_.pointRadius);
};

function create(type) {
  var constructor = projection((type || 'mercator').toLowerCase());
  if (!constructor) error('Unrecognized projection type: ' + type);
  return constructor();
}

function set(proj, key, value) {
   if (isFunction(proj[key])) proj[key](value);
}
import {Transform} from 'vega-dataflow';
import {error, inherits} from 'vega-util';
import {projection, projectionProperties} from 'vega-projection';

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
    projectionProperties.forEach(function(prop) {
      if (_[prop] != null) proj[prop](_[prop]);
    });
  } else {
    projectionProperties.forEach(function(prop) {
      if (_.modified(prop)) proj[prop](_[prop]);
    });
  }
};

function create(type) {
  var constructor = projection((type || 'mercator').toLowerCase());
  if (!constructor) error('Unrecognized projection type: ' + type);
  return constructor();
}

import {Transform} from 'vega-dataflow';
import {inherits, field} from 'vega-util';

/**
 * Annotate items with a geopath shape generator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='path'] - The output field in which to store
 *   the generated path data (default 'path').
 */
export default function GeoShape(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(GeoShape, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      shape = this.value,
      datum = _.field || field('datum'),
      as = _.as || 'shape',
      flag = out.ADD_MOD;

  if (!shape || _.modified()) {
    // parameters updated, reset and reflow
    this.value = shape = shapeGenerator(_.projection.path, datum);
    out.materialize().reflow();
    flag = out.SOURCE;
  }

  out.visit(flag, function(t) { t[as] = shape; });

  return out.modifies(as);
};

function shapeGenerator(path, field) {
  var shape = function(_) { return path(field(_)); };
  shape.context = function(_) { return path.context(_), shape; };
  return shape;
}

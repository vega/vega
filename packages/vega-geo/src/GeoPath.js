import {Transform} from 'vega-dataflow';
import {inherits, identity} from 'vega-util';

/**
 * Map GeoJSON data to an SVG path string.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='path'] - The output field in which to store
 *   the generated path data (default 'path').
 */
export default function GeoPath(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(GeoPath, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      path = this.value,
      field = _.field || identity,
      as = _.as || 'path',
      mod;

  function set(t) { t[as] = path(field(t)); }

  if (!path || _.modified()) {
    // parameters updated, reset and reflow
    this.value = path = _.projection.path;
    out.materialize().reflow().visit(out.SOURCE, set);
  } else {
    mod = field === identity || pulse.modified(field.fields);
    out.visit(mod ? out.ADD_MOD : out.ADD, set);
  }

  return out.modifies(as);
};

import {Transform} from 'vega-dataflow';
import {inherits} from 'vega-util';

/**
 * Geo-code a longitude/latitude point to an x/y coordinate.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {Array<function(object): *>} params.fields - A two-element array of
 *   field accessors for the longitude and latitude values.
 * @param {Array<string>} [params.as] - A two-element array of field names
 *   under which to store the result. Defaults to ['x','y'].
 */
export default function GeoPoint(params) {
  Transform.call(this, null, params);
}

GeoPoint.Definition = {
  'type': 'GeoPoint',
  'metadata': {'modifies': true},
  'params': [
    { 'name': 'projection', 'type': 'projection', 'required': true },
    { 'name': 'fields', 'type': 'field', 'array': true, 'required': true, 'length': 2 },
    { 'name': 'as', 'type': 'string', 'array': true, 'length': 2, 'default': ['x', 'y'] }
  ]
};

inherits(GeoPoint, Transform, {
  transform(_, pulse) {
    var proj = _.projection;
    var lon = _.fields[0];
    var lat = _.fields[1];
    var as = _.as || ['x', 'y'];
    var x = as[0];
    var y = as[1];
    var mod;

    function set(t) {
      const xy = proj([lon(t), lat(t)]);
      if (xy) {
        t[x] = xy[0];
        t[y] = xy[1];
      } else {
        t[x] = undefined;
        t[y] = undefined;
      }
    }

    if (_.modified()) {
      // parameters updated, reflow
      pulse = pulse.materialize().reflow(true).visit(pulse.SOURCE, set);
    } else {
      mod = pulse.modified(lon.fields) || pulse.modified(lat.fields);
      pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
    }

    return pulse.modifies(as);
  }
});

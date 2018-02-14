import {Transform} from 'vega-dataflow';
import {inherits} from 'vega-util';

/**
 * Computes extents (min/max) for a data field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field over which to compute extends.
 */
export default function Extent(params) {
  Transform.call(this, [+Infinity, -Infinity], params);
}

Extent.Definition = {
  "type": "Extent",
  "metadata": {},
  "params": [
    { "name": "field", "type": "field", "required": true }
  ]
};

var prototype = inherits(Extent, Transform);

prototype.transform = function(_, pulse) {
  var extent = this.value,
      field = _.field,
      min = extent[0],
      max = extent[1],
      flag = pulse.ADD,
      mod;

  mod = pulse.changed()
     || pulse.modified(field.fields)
     || _.modified('field');

  if (mod) {
    flag = pulse.SOURCE;
    min = +Infinity;
    max = -Infinity;
  }

  pulse.visit(flag, function(t) {
    var v = field(t);
    if (v != null) {
      // coerce to number
      v = +v;
      // NaNs will fail all comparisons!
      if (v < min) min = v;
      if (v > max) max = v;
    }
  });

  this.value = [min, max];
};

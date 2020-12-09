import {Transform} from 'vega-dataflow';
import {accessorName, inherits, toNumber} from 'vega-util';

/**
 * Computes extents (min/max) for a data field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field over which to compute extends.
 */
export default function Extent(params) {
  Transform.call(this, [undefined, undefined], params);
}

Extent.Definition = {
  'type': 'Extent',
  'metadata': {},
  'params': [
    { 'name': 'field', 'type': 'field', 'required': true }
  ]
};

inherits(Extent, Transform, {
  transform(_, pulse) {
    const extent = this.value,
          field = _.field,
          mod = pulse.changed()
            || pulse.modified(field.fields)
            || _.modified('field');

    let min = extent[0],
        max = extent[1];
    if (mod || min == null) {
      min = +Infinity;
      max = -Infinity;
    }

    pulse.visit(mod ? pulse.SOURCE : pulse.ADD, t => {
      const v = toNumber(field(t));
      if (v != null) {
        // NaNs will fail all comparisons!
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      let name = accessorName(field);
      if (name) name = ` for field "${name}"`;
      pulse.dataflow.warn(`Infinite extent${name}: [${min}, ${max}]`);
      min = max = undefined;
    }
    this.value = [min, max];
  }
});

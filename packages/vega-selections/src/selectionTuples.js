import {extend, field} from 'vega-util';

/**
 * Maps an array of scene graph items to an array of selection tuples.
 * @param {string} name  - The name of the dataset representing the selection.
 * @param {string} unit  - The name of the unit view.
 *
 * @returns {array} An array of selection entries for the given unit.
 */
export function selectionTuples(array, base) {
  return array.map(x => extend({
    values: base.fields.map(f => (f.getter || (f.getter = field(f.field)))(x.datum))
  }, base));
}

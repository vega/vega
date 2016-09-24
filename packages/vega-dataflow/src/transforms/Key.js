import Operator from '../Operator';
import {inherits, key} from 'vega-util';

/**
 * Generates a key function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<string>} params.fields - The field name(s) for the key function.
 */
export default function Key(params) {
  Operator.call(this, null, update, params);
}

inherits(Key, Operator);

function update(_) {
  return (this.value && !_.modified()) ? this.value : key(_.fields);
}

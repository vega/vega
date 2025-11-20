import {extend} from 'vega-util';
import {$selectionId, SelectionId, getter} from './util.js';
import { error, isArray, isString } from 'vega-util';

/**
 * Maps an array of scene graph items to an array of selection tuples.
 * @param {string} name  - The name of the dataset representing the selection.
 * @param {string} base  - The base object that generated tuples extend.
 *
 * @returns {array} An array of selection entries for the given unit.
 */
export function selectionTuples(array, base) {

  if (!isArray(array)) {
    error('First argument to selectionTuples must be an array.');
  }
  if (!isString(base)) {
    error('Second argument to selectionTuples must be a string.');
  }

  return array.map(x => extend(
    base.fields ? {
      values: base.fields.map(f => getter(f)(x.datum))
    } : {
      [SelectionId]: $selectionId(x.datum)
    }, base));
}

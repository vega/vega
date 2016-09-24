import Transform from '../Transform';
import {inherits} from 'vega-util';

/**
 * An index that maps from unique, string-coerced, field values to tuples.
 * Assumes that the field serves as a unique key with no duplicate values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field accessor to index.
 */
export default function TupleIndex(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(TupleIndex, Transform);

prototype.transform = function(_, pulse) {
  var field = _.field,
      index = this.value,
      mod = true;

  function set(t) { index[field(t)] = t; }

  if (_.modified('field') || pulse.modified(field.fields)) {
    this.value = index = {};
    pulse.visit(pulse.SOURCE, set);
  } else if (pulse.changed()) {
    pulse.visit(pulse.REM, function(t) { index[field(t)] = undefined; });
    pulse.visit(pulse.ADD, set);
  } else {
    mod = false;
  }

  this.modified(mod);
  return pulse.fork();
};

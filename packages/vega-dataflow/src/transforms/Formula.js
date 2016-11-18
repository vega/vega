import Transform from '../Transform';
import {inherits} from 'vega-util';

/**
 * Invokes a function for each data tuple and saves the results as a new field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.expr - The formula function to invoke for each tuple.
 * @param {string} params.as - The field name under which to save the result.
 */
export default function Formula(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Formula, Transform);

prototype.transform = function(_, pulse) {
  var func = _.expr,
      as = _.as,
      mod;

  function set(t) {
    t[as] = func(t, _);
  }

  if (_.modified()) {
    // parameters updated, need to reflow
    pulse = pulse.materialize().reflow(true).visit(pulse.SOURCE, set);
  } else {
    mod = pulse.modified(func.fields);
    pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
  }

  return pulse.modifies(as);
};

import Transform from '../Transform';
import {fastmap, inherits} from 'vega-util';

/**
 * Filters data tuples according to a predicate function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.expr - The predicate expression function
 *   that determines a tuple's filter status. Truthy values pass the filter.
 */
export default function Filter(params) {
  Transform.call(this, fastmap(), params);
}

var prototype = inherits(Filter, Transform);

prototype.transform = function(_, pulse) {
  var df = pulse.dataflow,
      cache = this.value, // cache ids of filtered tuples
      output = pulse.fork(),
      add = output.add,
      rem = output.rem,
      mod = output.mod,
      test = _.expr,
      isMod = true;

  pulse.visit(pulse.REM, function(t) {
    if (!cache.has(t._id)) rem.push(t);
    else cache.delete(t._id);
  });

  pulse.visit(pulse.ADD, function(t) {
    if (test(t, _)) add.push(t);
    else cache.set(t._id, 1);
  });

  function revisit(t) {
    var b = test(t, _),
        s = cache.get(t._id);
    if (b && s) {
      cache.delete(t._id);
      add.push(t);
    } else if (!b && !s) {
      cache.set(t._id, 1);
      rem.push(t);
    } else if (isMod && b && !s) {
      mod.push(t);
    }
  }

  pulse.visit(pulse.MOD, revisit);

  if (_.modified()) {
    isMod = false;
    pulse.visit(pulse.REFLOW, revisit);
  }

  if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
  return output;
};

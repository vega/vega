import Transform from '../Transform';
import {inherits} from 'vega-util';

/**
 * Filters data tuples according to a predicate function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.expr - The predicate expression function
 *   that determines a tuple's filter status. Truthy values pass the filter.
 */
export default function Filter(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(Filter, Transform);

prototype.transform = function(_, pulse) {
  var test = _.expr,
      cache = this.value, // cache ids of filtered tuples
      output = pulse.fork(),
      add = output.add,
      rem = output.rem,
      mod = output.mod, isMod = true;

  pulse.visit(pulse.REM, function(x) {
    if (!cache[x._id]) rem.push(x);
    else cache[x._id] = 0;
  });

  pulse.visit(pulse.ADD, function(x) {
    if (test(x, _)) add.push(x);
    else cache[x._id] = 1;
  });

  function revisit(x) {
    var b = test(x, _),
        s = cache[x._id];
    if (b && s) {
      cache[x._id] = 0;
      add.push(x);
    } else if (!b && !s) {
      cache[x._id] = 1;
      rem.push(x);
    } else if (isMod && b && !s) {
      mod.push(x);
    }
  }

  pulse.visit(pulse.MOD, revisit);

  if (_.modified()) {
    isMod = false;
    pulse.visit(pulse.REFLOW, revisit);
  }

  return output;
};

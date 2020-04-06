import {Transform, tupleid} from 'vega-dataflow';
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

Filter.Definition = {
  type: 'Filter',
  metadata: {changes: true},
  params: [{name: 'expr', type: 'expr', required: true}]
};

const prototype = inherits(Filter, Transform);

prototype.transform = function (_, pulse) {
  const df = pulse.dataflow;
  const cache = this.value; // cache ids of filtered tuples
  const output = pulse.fork();
  const add = output.add;
  const rem = output.rem;
  const mod = output.mod;
  const test = _.expr;
  let isMod = true;

  pulse.visit(pulse.REM, function (t) {
    const id = tupleid(t);
    if (!cache.has(id)) rem.push(t);
    else cache.delete(id);
  });

  pulse.visit(pulse.ADD, function (t) {
    if (test(t, _)) add.push(t);
    else cache.set(tupleid(t), 1);
  });

  function revisit(t) {
    const id = tupleid(t);
    const b = test(t, _);
    const s = cache.get(id);
    if (b && s) {
      cache.delete(id);
      add.push(t);
    } else if (!b && !s) {
      cache.set(id, 1);
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

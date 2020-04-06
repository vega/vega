import {Transform} from 'vega-dataflow';
import {inherits} from 'vega-util';

const COUNTER_NAME = ':vega_identifier:';

/**
 * Adds a unique identifier to all added tuples.
 * This transform creates a new signal that serves as an id counter.
 * As a result, the id counter is shared across all instances of this
 * transform, generating unique ids across multiple data streams. In
 * addition, this signal value can be included in a snapshot of the
 * dataflow state, enabling correct resumption of id allocation.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.as - The field name for the generated identifier.
 */
export default function Identifier(params) {
  Transform.call(this, 0, params);
}

Identifier.Definition = {
  type: 'Identifier',
  metadata: {modifies: true},
  params: [{name: 'as', type: 'string', required: true}]
};

const prototype = inherits(Identifier, Transform);

prototype.transform = function (_, pulse) {
  const counter = getCounter(pulse.dataflow);
  let id = counter.value;
  const as = _.as;

  pulse.visit(pulse.ADD, function (t) {
    if (!t[as]) t[as] = ++id;
  });

  counter.set((this.value = id));
  return pulse;
};

function getCounter(view) {
  let counter = view._signals[COUNTER_NAME];
  if (!counter) {
    view._signals[COUNTER_NAME] = counter = view.add(0);
  }
  return counter;
}

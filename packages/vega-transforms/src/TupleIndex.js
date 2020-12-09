import {Transform} from 'vega-dataflow';
import {fastmap, inherits} from 'vega-util';

/**
 * An index that maps from unique, string-coerced, field values to tuples.
 * Assumes that the field serves as a unique key with no duplicate values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field accessor to index.
 */
export default function TupleIndex(params) {
  Transform.call(this, fastmap(), params);
}

inherits(TupleIndex, Transform, {
  transform(_, pulse) {
    const df = pulse.dataflow,
        field = _.field,
        index = this.value,
        set = t => index.set(field(t), t);

    let mod = true;

    if (_.modified('field') || pulse.modified(field.fields)) {
      index.clear();
      pulse.visit(pulse.SOURCE, set);
    } else if (pulse.changed()) {
      pulse.visit(pulse.REM, t => index.delete(field(t)));
      pulse.visit(pulse.ADD, set);
    } else {
      mod = false;
    }

    this.modified(mod);
    if (index.empty > df.cleanThreshold) df.runAfter(index.clean);
    return pulse.fork();
  }
});

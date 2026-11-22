import {Transform} from 'vega-dataflow';
import {fastmap, inherits} from 'vega-util';

/**
 * An index that maps from string-coerced field values to tuples.
 * If several tuples share a key, the index holds the last one in the
 * source, so that it matches an index built from scratch.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field accessor to index.
 */
export default function TupleIndex(params) {
  Transform.call(this, fastmap(), params);
  this._counts = new Map(); // number of tuples per (string-coerced) key
}

inherits(TupleIndex, Transform, {
  transform(_, pulse) {
    const df = pulse.dataflow,
        field = _.field,
        index = this.value,
        counts = this._counts,
        set = t => {
          const k = field(t), s = k + '';
          index.set(k, t);
          counts.set(s, (counts.get(s) || 0) + 1);
        };

    let mod = true;

    if (_.modified('field') || pulse.modified(field.fields)) {
      index.clear();
      counts.clear();
      pulse.visit(pulse.SOURCE, set);
    } else if (pulse.changed()) {
      const stale = new Set();
      pulse.visit(pulse.REM, t => {
        const k = field(t), s = k + '', n = (counts.get(s) || 1) - 1;
        if (n > 0) {
          counts.set(s, n);
          // other tuples share this key: re-pick if the indexed one is removed
          if (index.get(k) === t) stale.add(s);
        } else {
          counts.delete(s);
          index.delete(k);
        }
      });
      pulse.visit(pulse.ADD, set);
      if (stale.size) {
        pulse.visit(pulse.SOURCE, t => {
          const k = field(t);
          if (stale.has(k + '')) index.set(k, t);
        });
      }
    } else {
      mod = false;
    }

    this.modified(mod);
    if (index.empty > df.cleanThreshold) df.runAfter(index.clean);
    return pulse.fork();
  }
});

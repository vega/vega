import Pulse from './Pulse.js';
import {error, inherits, isArray} from 'vega-util';

/**
 * Represents a set of multiple pulses. Used as input for operators
 * that accept multiple pulses at a time. Contained pulses are
 * accessible via the public "pulses" array property. This pulse doe
 * not carry added, removed or modified tuples directly. However,
 * the visit method can be used to traverse all such tuples contained
 * in sub-pulses with a timestamp matching this parent multi-pulse.
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 * @param {number} stamp - The timestamp.
 * @param {Array<Pulse>} pulses - The sub-pulses for this multi-pulse.
 */
export default function MultiPulse(dataflow, stamp, pulses, encode) {
  const p = this;
  let c = 0;

  this.dataflow = dataflow;
  this.stamp = stamp;
  this.fields = null;
  this.encode = encode || null;
  this.pulses = pulses;

  for (const pulse of pulses) {
    if (pulse.stamp !== stamp) continue;

    if (pulse.fields) {
      const hash = p.fields || (p.fields = {});
      for (const f in pulse.fields) { hash[f] = 1; }
    }

    if (pulse.changed(p.ADD)) c |= p.ADD;
    if (pulse.changed(p.REM)) c |= p.REM;
    if (pulse.changed(p.MOD)) c |= p.MOD;
  }

  this.changes = c;
}

inherits(MultiPulse, Pulse, {
  /**
   * Creates a new pulse based on the values of this pulse.
   * The dataflow, time stamp and field modification values are copied over.
   * @return {Pulse}
   */
  fork(flags) {
    const p = new Pulse(this.dataflow).init(this, flags & this.NO_FIELDS);
    if (flags !== undefined) {
      if (flags & p.ADD) this.visit(p.ADD, t => p.add.push(t));
      if (flags & p.REM) this.visit(p.REM, t => p.rem.push(t));
      if (flags & p.MOD) this.visit(p.MOD, t => p.mod.push(t));
    }
    return p;
  },

  changed(flags) {
    return this.changes & flags;
  },

  modified(_) {
    const p = this, fields = p.fields;
    return !(fields && (p.changes & p.MOD)) ? 0
      : isArray(_) ? _.some(f => fields[f])
      : fields[_];
  },

  filter() {
    error('MultiPulse does not support filtering.');
  },

  materialize() {
    error('MultiPulse does not support materialization.');
  },

  visit(flags, visitor) {
    const p = this,
          pulses = p.pulses,
          n = pulses.length;
    let i = 0;

    if (flags & p.SOURCE) {
      for (; i < n; ++i) {
        pulses[i].visit(flags, visitor);
      }
    } else {
      for (; i < n; ++i) {
        if (pulses[i].stamp === p.stamp) {
          pulses[i].visit(flags, visitor);
        }
      }
    }

    return p;
  }
});

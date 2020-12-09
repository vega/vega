import {Operator} from 'vega-dataflow';
import {inherits} from 'vega-util';

/**
 * Provides a bridge between a parent transform and a target subflow that
 * consumes only a subset of the tuples that pass through the parent.
 * @constructor
 * @param {Pulse} pulse - A pulse to use as the value of this operator.
 * @param {Transform} parent - The parent transform (typically a Facet instance).
 */
export default function Subflow(pulse, parent) {
  Operator.call(this, pulse);
  this.parent = parent;
  this.count = 0;
}

inherits(Subflow, Operator, {
  /**
   * Routes pulses from this subflow to a target transform.
   * @param {Transform} target - A transform that receives the subflow of tuples.
   */
  connect(target) {
    this.detachSubflow = target.detachSubflow;
    this.targets().add(target);
    return (target.source = this);
  },

  /**
   * Add an 'add' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being added.
   */
  add(t) {
    this.count += 1;
    this.value.add.push(t);
  },

  /**
   * Add a 'rem' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being removed.
   */
  rem(t) {
    this.count -= 1;
    this.value.rem.push(t);
  },

  /**
   * Add a 'mod' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being modified.
   */
  mod(t) {
    this.value.mod.push(t);
  },

  /**
   * Re-initialize this operator's pulse value.
   * @param {Pulse} pulse - The pulse to copy from.
   * @see Pulse.init
   */
  init(pulse) {
    this.value.init(pulse, pulse.NO_SOURCE);
  },

  /**
   * Evaluate this operator. This method overrides the
   * default behavior to simply return the contained pulse value.
   * @return {Pulse}
   */
  evaluate() {
    // assert: this.value.stamp === pulse.stamp
    return this.value;
  }
});

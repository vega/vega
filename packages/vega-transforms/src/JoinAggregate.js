import Aggregate from './Aggregate.js';
import {ValidAggregateOps} from './util/AggregateOps.js';
import {extend, inherits} from 'vega-util';

/**
 * Extend input tuples with aggregate values.
 * Calcuates aggregate values and joins them with the input stream.
 * @constructor
 */
export default function JoinAggregate(params) {
  Aggregate.call(this, params);
}

JoinAggregate.Definition = {
  'type': 'JoinAggregate',
  'metadata': {'modifies': true},
  'params': [
    { 'name': 'groupby', 'type': 'field', 'array': true },
    { 'name': 'fields', 'type': 'field', 'null': true, 'array': true },
    { 'name': 'ops', 'type': 'enum', 'array': true, 'values': ValidAggregateOps },
    { 'name': 'as', 'type': 'string', 'null': true, 'array': true },
    { 'name': 'key', 'type': 'field' }
  ]
};

inherits(JoinAggregate, Aggregate, {
  transform(_, pulse) {
    const aggr = this,
          mod = _.modified();
    let cells;

    // process all input tuples to calculate aggregates
    if (aggr.value && (mod || pulse.modified(aggr._inputs, true))) {
      cells = aggr.value = mod ? aggr.init(_) : {};
      pulse.visit(pulse.SOURCE, t => aggr.add(t));
    } else {
      cells = aggr.value = aggr.value || this.init(_);
      pulse.visit(pulse.REM, t => aggr.rem(t));
      pulse.visit(pulse.ADD, t => aggr.add(t));
    }

    // update aggregation cells
    aggr.changes();

    // write aggregate values to input tuples
    pulse.visit(pulse.SOURCE, t => {
      extend(t, cells[aggr.cellkey(t)].tuple);
    });

    return pulse.reflow(mod).modifies(this._outputs);
  },

  changes() {
    const adds = this._adds,
          mods = this._mods;
    let i, n;

    for (i=0, n=this._alen; i<n; ++i) {
      this.celltuple(adds[i]);
      adds[i] = null; // for garbage collection
    }

    for (i=0, n=this._mlen; i<n; ++i) {
      this.celltuple(mods[i]);
      mods[i] = null; // for garbage collection
    }

    this._alen = this._mlen = 0; // reset list of active cells
  }
});

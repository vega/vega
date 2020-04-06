import Subflow from './Subflow';
import {Transform, tupleid} from 'vega-dataflow';
import {fastmap, hasOwnProperty, inherits} from 'vega-util';

/**
 * Facets a dataflow into a set of subflows based on a key.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Dataflow, string): Operator} params.subflow - A function
 *   that generates a subflow of operators and returns its root operator.
 * @param {function(object): *} params.key - The key field to facet by.
 */
export default function Facet(params) {
  Transform.call(this, {}, params);
  this._keys = fastmap(); // cache previously calculated key values

  // keep track of active subflows, use as targets array for listeners
  // this allows us to limit propagation to only updated subflows
  const a = (this._targets = []);
  a.active = 0;
  a.forEach = function (f) {
    for (let i = 0, n = a.active; i < n; ++i) f(a[i], i, a);
  };
}

const prototype = inherits(Facet, Transform);

prototype.activate = function (flow) {
  this._targets[this._targets.active++] = flow;
};

prototype.subflow = function (key, flow, pulse, parent) {
  const flows = this.value;
  let sf = hasOwnProperty(flows, key) && flows[key];
  let df;
  let p;

  if (!sf) {
    p = parent || ((p = this._group[key]) && p.tuple);
    df = pulse.dataflow;
    sf = df.add(new Subflow(pulse.fork(pulse.NO_SOURCE), this)).connect(flow(df, key, p));
    flows[key] = sf;
    this.activate(sf);
  } else if (sf.value.stamp < pulse.stamp) {
    sf.init(pulse);
    this.activate(sf);
  }

  return sf;
};

prototype.transform = function (_, pulse) {
  const df = pulse.dataflow;
  const self = this;
  const key = _.key;
  const flow = _.subflow;
  const cache = this._keys;
  const rekey = _.modified('key');

  function subflow(key) {
    return self.subflow(key, flow, pulse);
  }

  this._group = _.group || {};
  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.REM, function (t) {
    const id = tupleid(t);
    const k = cache.get(id);
    if (k !== undefined) {
      cache.delete(id);
      subflow(k).rem(t);
    }
  });

  pulse.visit(pulse.ADD, function (t) {
    const k = key(t);
    cache.set(tupleid(t), k);
    subflow(k).add(t);
  });

  if (rekey || pulse.modified(key.fields)) {
    pulse.visit(pulse.MOD, function (t) {
      const id = tupleid(t);
      const k0 = cache.get(id);
      const k1 = key(t);
      if (k0 === k1) {
        subflow(k1).mod(t);
      } else {
        cache.set(id, k1);
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  } else if (pulse.changed(pulse.MOD)) {
    pulse.visit(pulse.MOD, function (t) {
      subflow(cache.get(tupleid(t))).mod(t);
    });
  }

  if (rekey) {
    pulse.visit(pulse.REFLOW, function (t) {
      const id = tupleid(t);
      const k0 = cache.get(id);
      const k1 = key(t);
      if (k0 !== k1) {
        cache.set(id, k1);
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  }

  if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
  return pulse;
};

import {Transform, derive, tupleid} from 'vega-dataflow';
import {inherits} from 'vega-util';

/**
 * Relays a data stream between data processing pipelines.
 * If the derive parameter is set, this transform will create derived
 * copies of observed tuples. This provides derived data streams in which
 * modifications to the tuples do not pollute an upstream data source.
 * @param {object} params - The parameters for this operator.
 * @param {number} [params.derive=false] - Boolean flag indicating if
 *   the transform should make derived copies of incoming tuples.
 * @constructor
 */
export default function Relay(params) {
  Transform.call(this, null, params);
}

inherits(Relay, Transform, {
  transform(_, pulse) {
    let out, lut;

    if (this.value) {
      lut = this.value;
    } else {
      out = pulse = pulse.addAll();
      lut = this.value = {};
    }

    if (_.derive) {
      out = pulse.fork(pulse.NO_SOURCE);

      pulse.visit(pulse.REM, t => {
        const id = tupleid(t);
        out.rem.push(lut[id]);
        lut[id] = null;
      });

      pulse.visit(pulse.ADD, t => {
        const dt = derive(t);
        lut[tupleid(t)] = dt;
        out.add.push(dt);
      });

      pulse.visit(pulse.MOD, t => {
        const dt = lut[tupleid(t)];
        for (const k in t) {
          dt[k] = t[k];
          // down stream writes may overwrite re-derived tuples
          // conservatively mark all source fields as modified
          out.modifies(k);
        }
        out.mod.push(dt);
      });
    }

    return out;
  }
});

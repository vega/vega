import Transform from '../Transform';
import {derive, rederive} from '../Tuple';
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

var prototype = inherits(Relay, Transform);

prototype.transform = function(_, pulse) {
  var out,
      lut = this.value || (out = pulse = pulse.addAll(), this.value = {});

  if (_.derive) {
    out = pulse.fork();

    pulse.visit(pulse.ADD, function(t) {
      var dt = derive(t);
      lut[t._id] = dt;
      out.add.push(dt);
    });

    pulse.visit(pulse.MOD, function(t) {
      out.mod.push(rederive(t, lut[t._id]));
    });

    pulse.visit(pulse.REM, function(t) {
      out.rem.push(lut[t._id]);
      lut[t._id] = null;
    });
  }

  return out;
};

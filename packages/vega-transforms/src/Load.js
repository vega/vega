import {ingest, Transform} from 'vega-dataflow';
import {array, inherits} from 'vega-util';

/**
 * Load and parse data from an external source. Marshalls parameter
 * values and then invokes the Dataflow request method.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.url - The URL to load from.
 * @param {object} params.format - The data format options.
 */
export default function Load(params) {
  Transform.call(this, [], params);
}

var prototype = inherits(Load, Transform);

prototype.transform = function(_, pulse) {
  const df = pulse.dataflow;

  if (_.values) {
    // parse and ingest values
    return output(this, pulse, df.parse(_.values, _.format));
  } else {
    // return promise for async loading
    return df.request(_.url, _.format)
      .then(res => output(this, pulse, array(res.data)));
  }
};

function output(op, pulse, data) {
  data.forEach(ingest);
  const out = pulse.fork(pulse.NO_FIELDS & pulse.NO_SOURCE);
  out.rem = op.value;
  op.value = out.add = out.source = data;
  return out;
}

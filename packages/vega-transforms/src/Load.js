import {Transform} from 'vega-dataflow';
import {inherits} from 'vega-util';

/**
 * Load and parse data from an external source. Marshalls parameter
 * values and then invokes the Dataflow request method.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.url - The URL to load from.
 * @param {object} params.format - The data format options.
 */
export default function Load(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Load, Transform);

prototype.transform = function(_, pulse) {
  pulse.dataflow.request(this.target, _.url, _.format);
};

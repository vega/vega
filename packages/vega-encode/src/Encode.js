import {Transform} from 'vega-dataflow';
import {inherits, falsy} from 'vega-util';

/**
 * Invokes encoding functions for visual items.
 * @constructor
 * @param {object} params - The parameters to the encoding functions. This
 *   parameter object will be passed through to all invoked encoding functions.
 * @param {object} param.encoders - The encoding functions
 * @param {function(object, object): boolean} [param.encoders.update] - Update encoding set
 * @param {function(object, object): boolean} [param.encoders.enter] - Enter encoding set
 * @param {function(object, object): boolean} [param.encoders.exit] - Exit encoding set
 */
export default function Encode(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Encode, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ADD_REM),
      update = _.encoders.update || falsy,
      enter = _.encoders.enter || falsy,
      exit = _.encoders.exit || falsy,
      set = (pulse.encode ? _.encoders[pulse.encode] : update) || falsy;

  if (enter !== falsy || update !== falsy) {
    pulse.visit(pulse.ADD, function(t) {
      enter(t, _);
      update(t, _);
      if (set !== falsy && set !== update) set(t, _);
    });
  }

  if (exit !== falsy) {
    pulse.visit(pulse.REM, function(t) {
      exit(t, _);
    });
  }

  if (set !== falsy) {
    var flag = pulse.MOD | (_.modified() ? pulse.REFLOW : 0);
    pulse.visit(flag, function(t) {
      if (set(t, _)) { out.mod.push(t); }
    });
  }

  return out;
};

import Transform from '../Transform';
import {inherits, accessor, accessorFields, accessorName} from 'vega-util';
import {bin} from 'vega-statistics';

/**
 * Generates a binning function for discretizing data.
 * @constructor
 * @param {object} params - The parameters for this operator. The
 *   provided values should be valid options for the {@link bin} function.
 * @param {function(object): *} params.field - The data field to bin.
 */
export default function Bin(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Bin, Transform);

prototype.transform = function(_, pulse) {
  var bins = this._bins(_),
      step = bins.step,
      as = _.as || ['bin0', 'bin1'],
      b0 = as[0],
      b1 = as[1],
      flag = _.modified() ? (pulse = pulse.reflow(true), pulse.SOURCE)
        : pulse.modified(accessorFields(_.field)) ? pulse.ADD_MOD
        : pulse.ADD;

  pulse.visit(flag, function(t) {
    var v = bins(t);
    t[b0] = v;
    t[b1] = v != null ? v + step : null;
  });

  return pulse.modifies(as);
};

prototype._bins = function(_) {
  if (this.value && !_.modified()) {
    return this.value;
  }

  var field = _.field,
      bins  = bin(_),
      start = bins.start,
      stop  = bins.stop,
      step  = bins.step,
      a, d;

  if ((a = _.anchor) != null) {
    d = a - (start + step * Math.floor((a - start) / step));
    start += d;
    stop += d;
  }

  var f = function(t) {
    var v = field(t);
    return v == null ? null
      : (v = Math.max(start, Math.min(+v, stop - step)),
         start + step * Math.floor((v - start) / step));
  };

  f.start = start;
  f.stop = stop;
  f.step = step;

  return this.value = accessor(
    f,
    accessorFields(field),
    _.name || 'bin_' + accessorName(field)
  );
};

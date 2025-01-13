import { Transform } from 'vega-dataflow';
import { bin } from 'vega-statistics';
import { accessor, accessorFields, accessorName, inherits, toNumber } from 'vega-util';

// epsilon bias to offset floating point error (#1737)
const EPSILON = 1e-14;

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

Bin.Definition = {
  'type': 'Bin',
  'metadata': {'modifies': true},
  'params': [
    { 'name': 'field', 'type': 'field', 'required': true },
    { 'name': 'interval', 'type': 'boolean', 'default': true },
    { 'name': 'anchor', 'type': 'number' },
    { 'name': 'maxbins', 'type': 'number', 'default': 20 },
    { 'name': 'base', 'type': 'number', 'default': 10 },
    { 'name': 'divide', 'type': 'number', 'array': true, 'default': [5, 2] },
    { 'name': 'extent', 'type': 'number', 'array': true, 'length': 2, 'required': true },
    { 'name': 'span', 'type': 'number' },
    { 'name': 'step', 'type': 'number' },
    { 'name': 'steps', 'type': 'number', 'array': true },
    { 'name': 'minstep', 'type': 'number', 'default': 0 },
    { 'name': 'nice', 'type': 'boolean', 'default': true },
    { 'name': 'name', 'type': 'string' },
    { 'name': 'as', 'type': 'string', 'array': true, 'length': 2, 'default': ['bin0', 'bin1'] },
    { 'name': 'thresholds', 'type': 'number', 'array': true }
  ]
};

inherits(Bin, Transform, {
  transform(_, pulse) {
    const band = _.interval !== false,
        bins = this._bins(_),
        start = bins.start,
        step = bins.step,
        as = _.as || ['bin0', 'bin1'],
        b0 = as[0],
        b1 = as[1];

    let flag;
    if (_.modified()) {
      pulse = pulse.reflow(true);
      flag = pulse.SOURCE;
    } else {
      flag = pulse.modified(accessorFields(_.field)) ? pulse.ADD_MOD : pulse.ADD;
    }

    pulse.visit(flag, band
      ? t => {
        const v = bins(t);
        t[b0] = v;
        if(v == null){
          t[b1] = null;
        } else if(bins.thresholds){
          const thresholds = bins.thresholds;
          const index = thresholds.findIndex((t, i) => v >= t && v < thresholds[i + 1]);
          // set upper boundary to next threshold value, or to infinity when min bound is the max threshold
          t[b1] = index >= 0 ? thresholds[index + 1] : v === thresholds[thresholds.length - 1] ? Infinity : thresholds[0];
        } else {
          t[b1] = start + step * (1 + (v - start) / step);
        }
      }
       
      : t => t[b0] = bins(t)
    );

    return pulse.modifies(band ? as : b0);
  },

  _bins(_) {
    if (this.value && !_.modified()) {
      return this.value;
    }

    const field = _.field;

    if (_.thresholds) {
      const thresholds = _.thresholds.slice().sort((a, b) => a - b);

      const f = function (t) {
        const v = toNumber(field(t));
        if (v == null) return null;

        for (let i = 0; i < thresholds.length - 1; i++) {
          if (v >= thresholds[i] && v < thresholds[i + 1]) {
            return thresholds[i];
          }
        }

        // The last bin should contain the highest threshold's value
        if (v === thresholds[thresholds.length - 1]) {
          return thresholds[thresholds.length - 1];
        }

        return v < thresholds[0] ? -Infinity : Infinity;
      };

      f.start = thresholds[0];
      f.stop = thresholds[thresholds.length - 1];
      f.step = null; // No step for thresholds
      f.thresholds = thresholds; // Save thresholds for use in `transform`

      return this.value = accessor(
        f,
        accessorFields(field),
        _.name || 'bin_' + accessorName(field)
      );
    }

    const bins = bin(_),
      step = bins.step;
    let start = bins.start,
      stop = start + Math.ceil((bins.stop - start) / step) * step,
      a, d;

    if ((a = _.anchor) != null) {
      d = a - (start + step * Math.floor((a - start) / step));
      start += d;
      stop += d;
    }

    const f = function (t) {
      let v = toNumber(field(t));
      return v == null ? null
        : v < start ? -Infinity
          : v > stop ? +Infinity
            : (
              v = Math.max(start, Math.min(v, stop - step)),
              start + step * Math.floor(EPSILON + (v - start) / step)
            );
    };

    f.start = start;
    f.stop = bins.stop;
    f.step = step;

    return this.value = accessor(
      f,
      accessorFields(field),
      _.name || 'bin_' + accessorName(field)
    );
  }
});

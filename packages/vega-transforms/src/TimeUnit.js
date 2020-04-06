import {Transform} from 'vega-dataflow';
import {timeBin, timeUnits, timeFloor, utcFloor, timeInterval, utcInterval} from 'vega-time';
import {accessorFields, extent, inherits, peek} from 'vega-util';

/**
 * Discretize dates to specific time units.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The data field containing date/time values.
 */
export default function TimeUnit(params) {
  Transform.call(this, null, params);
}

const OUTPUT = ['unit0', 'unit1'];

TimeUnit.Definition = {
  type: 'TimeUnit',
  metadata: {modifies: true},
  params: [
    {name: 'field', type: 'field', required: true},
    {name: 'interval', type: 'boolean', default: true},
    {name: 'units', type: 'string', array: true},
    {name: 'step', type: 'number', default: 1},
    {name: 'maxbins', type: 'number', default: 40},
    {name: 'extent', type: 'date', array: true},
    {name: 'timezone', type: 'enum', default: 'local', values: ['local', 'utc']},
    {name: 'as', type: 'string', array: true, length: 2, default: OUTPUT}
  ]
};

const prototype = inherits(TimeUnit, Transform);

prototype.transform = function (_, pulse) {
  const field = _.field;
  const band = _.interval !== false;
  const utc = _.timezone === 'utc';
  const floor = this._floor(_, pulse);
  const offset = (utc ? utcInterval : timeInterval)(floor.unit).offset;
  const as = _.as || OUTPUT;
  const u0 = as[0];
  const u1 = as[1];
  let min = floor.start || Infinity;
  let max = floor.stop || -Infinity;
  const step = floor.step;
  let flag = pulse.ADD;

  if (_.modified() || pulse.modified(accessorFields(field))) {
    pulse = pulse.reflow(true);
    flag = pulse.SOURCE;
    min = Infinity;
    max = -Infinity;
  }

  pulse.visit(flag, function (t) {
    const v = field(t);
    let a;
    let b;
    if (v == null) {
      t[u0] = null;
      if (band) t[u1] = null;
    } else {
      t[u0] = a = b = floor(v);
      if (band) t[u1] = b = offset(a, step);
      if (a < min) min = a;
      if (b > max) max = b;
    }
  });

  floor.start = min;
  floor.stop = max;

  return pulse.modifies(band ? as : u0);
};

prototype._floor = function (_, pulse) {
  const utc = _.timezone === 'utc';

  // get parameters
  let {units, step} = _.units // eslint-disable-line prefer-const
    ? {units: _.units, step: _.step || 1}
    : timeBin({
        extent: _.extent || extent(pulse.materialize(pulse.SOURCE).source, _.field),
        maxbins: _.maxbins
      });

  // check / standardize time units
  units = timeUnits(units);

  const prev = this.value || {};
  const floor = (utc ? utcFloor : timeFloor)(units, step);

  floor.unit = peek(units);
  floor.units = units;
  floor.step = step;
  floor.start = prev.start;
  floor.stop = prev.stop;
  return (this.value = floor);
};

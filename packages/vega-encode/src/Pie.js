import {Transform} from 'vega-dataflow';
import {inherits, one} from 'vega-util';
import {range, sum} from 'd3-array';

/**
 * Pie and donut chart layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size pie segments.
 * @param {number} [params.startAngle=0] - The start angle (in radians) of the layout.
 * @param {number} [params.endAngle=2π] - The end angle (in radians) of the layout.
 * @param {boolean} [params.sort] - Boolean flag for sorting sectors by value.
 */
export default function Pie(params) {
  Transform.call(this, null, params);
}

Pie.Definition = {
  'type': 'Pie',
  'metadata': {'modifies': true},
  'params': [
    { 'name': 'field', 'type': 'field' },
    { 'name': 'startAngle', 'type': 'number', 'default': 0 },
    { 'name': 'endAngle', 'type': 'number', 'default': 6.283185307179586 },
    { 'name': 'sort', 'type': 'boolean', 'default': false },
    { 'name': 'as', 'type': 'string', 'array': true, 'length': 2, 'default': ['startAngle', 'endAngle'] }
  ]
};

inherits(Pie, Transform, {
  transform(_, pulse) {
    var as = _.as || ['startAngle', 'endAngle'];
    var startAngle = as[0];
    var endAngle = as[1];
    var field = _.field || one;
    var start = _.startAngle || 0;
    var stop = _.endAngle != null ? _.endAngle : 2 * Math.PI;
    var data = pulse.source;
    var values = data.map(field);
    var n = values.length;
    var a = start;
    var k = (stop - start) / sum(values);
    var index = range(n);
    var i;
    var t;
    var v;

    if (_.sort) {
      index.sort((a, b) => values[a] - values[b]);
    }

    for (i=0; i<n; ++i) {
      v = values[index[i]];
      t = data[index[i]];
      t[startAngle] = a;
      t[endAngle] = (a += v * k);
    }

    this.value = values;
    return pulse.reflow(_.modified()).modifies(as);
  }
});

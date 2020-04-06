import density2D from './util/density2D';
import {ingest, Transform} from 'vega-dataflow';
import {accessorName, inherits} from 'vega-util';

/**
 * Perform 2D kernel-density estimation of point data.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<number>} params.size - The [width, height] extent (in
 *   units of input pixels) over which to perform density estimation.
 * @param {function(object): number} params.x - The x-coordinate accessor.
 * @param {function(object): number} params.y - The y-coordinate accessor.
 * @param {function(object): number} [params.weight] - The weight accessor.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors
 *   to groupby.
 * @param {number} [params.cellSize] - Contour density calculation cell size.
 *   This parameter determines the level of spatial approximation. For example,
 *   the default value of 4 maps to 2x reductions in both x- and y- dimensions.
 *   A value of 1 will result in an output raster grid whose dimensions exactly
 *   matches the size parameter.
 * @param {Array<number>} [params.bandwidth] - The KDE kernel bandwidths,
 *   in pixels. The input can be a two-element array specifying separate
 *   x and y bandwidths, or a single-element array specifying both. If the
 *   bandwidth is unspecified or less than zero, the bandwidth will be
 *   automatically determined.
 * @param {boolean} [params.counts=false] - A boolean flag indicating if the
 *   output values should be probability estimates (false, default) or
 *   smoothed counts (true).
 * @param {string} [params.as='grid'] - The output field in which to store
 *   the generated raster grid (default 'grid').
 */
export default function KDE2D(params) {
  Transform.call(this, null, params);
}

KDE2D.Definition = {
  type: 'KDE2D',
  metadata: {generates: true},
  params: [
    {name: 'size', type: 'number', array: true, length: 2, required: true},
    {name: 'x', type: 'field', required: true},
    {name: 'y', type: 'field', required: true},
    {name: 'weight', type: 'field'},
    {name: 'groupby', type: 'field', array: true},
    {name: 'cellSize', type: 'number'},
    {name: 'bandwidth', type: 'number', array: true, length: 2},
    {name: 'counts', type: 'boolean', default: false},
    {name: 'as', type: 'string', default: 'grid'}
  ]
};

const prototype = inherits(KDE2D, Transform);

const PARAMS = ['x', 'y', 'weight', 'size', 'cellSize', 'bandwidth'];

export function params(obj, _) {
  PARAMS.forEach(param => (_[param] != null ? obj[param](_[param]) : 0));
  return obj;
}

prototype.transform = function (_, pulse) {
  if (this.value && !pulse.changed() && !_.modified()) return pulse.StopPropagation;

  const out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
  const source = pulse.materialize(pulse.SOURCE).source;
  const groups = partition(source, _.groupby);
  const names = (_.groupby || []).map(accessorName);
  const kde = params(density2D(), _);
  const as = _.as || 'grid';
  let values = [];

  function set(t, vals) {
    for (let i = 0; i < names.length; ++i) t[names[i]] = vals[i];
    return t;
  }

  // generate density raster grids
  values = groups.map(g => ingest(set({[as]: kde(g, _.counts)}, g.dims)));

  if (this.value) out.rem = this.value;
  this.value = out.source = out.add = values;

  return out;
};

export function partition(data, groupby) {
  const groups = [];
  const get = f => f(t);
  let map;
  let i;
  let n;
  let t;
  let k;
  let g;

  // partition data points into groups
  if (groupby == null) {
    groups.push(data);
  } else {
    for (map = {}, i = 0, n = data.length; i < n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = g = [];
        g.dims = k;
        groups.push(g);
      }
      g.push(t);
    }
  }

  return groups;
}

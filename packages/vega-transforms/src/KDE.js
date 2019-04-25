import {randomKDE} from 'vega-statistics';
import {ingest, Transform} from 'vega-dataflow';
import {accessorName, error, inherits} from 'vega-util';
import {extent, range} from 'd3-array';

/**
 * Compute kernel density estimates (KDE) for one or more data groups.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {function(object): *} params.field - An accessor for the data field to estimate.
 * @param {number} [params.bandwidth=0] - The KDE bandwidth. If unspecified, the bandwidth is automatically determined.
 * @param {string} [params.method='pdf'] - The distribution method to sample.
 *   One of 'pdf' or 'cdf'.
  * @param {number} [params.steps=100] - The number of sampling steps.
 */
export default function KDE(params) {
  Transform.call(this, null, params);
}

KDE.Definition = {
  "type": "KDE",
  "metadata": {"generates": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "field", "type": "field", "required": true },
    { "name": "method", "type": "string", "default": "pdf", "values": ["pdf", "cdf"] },
    { "name": "bandwidth", "type": "number", "default": 0 },
    { "name": "extent", "type": "number", "array": true, "length": 2 },
    { "name": "steps", "type": "number", "default": 100 },
    { "name": "as", "type": "string", "array": true, "default": ["value", "density"] }
  ]
};

var prototype = inherits(KDE, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);

  if (!this.value || pulse.changed() || _.modified()) {
    const source = pulse.materialize(pulse.SOURCE).source,
          groups = partition(source, _.groupby, _.field),
          names = _.groupby.map(accessorName),
          bandwidth = _.bandwidth,
          method = _.method || 'pdf',
          as = _.as || ['value', 'density'],
          values = [];

    if (method !== 'pdf' && method !== 'cdf') {
      error('Invalid density method: ' + method);
    }

    groups.forEach(g => {
      const dist = randomKDE(g, bandwidth),
            domain = _.extent || extent(g),
            step = (domain[1] - domain[0]) / (_.steps || 100);

      range(domain[0], domain[1] + step/2, step).forEach(v => {
        const t = {};
        for (let i=0; i<names.length; ++i) {
          t[names[i]] = g.dims[i];
        }
        t[as[0]] = v;
        t[as[1]] = dist[method](v);
        values.push(ingest(t));
      });
    });

    if (this.value) out.rem = this.value;
    this.value = out.add = out.source = values;
  }

  return out;
};

function partition(data, groupby, field) {
  var groups = [],
      get = function(f) { return f(t); },
      map, i, n, t, k, g;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.map(field));
  } else {
    for (map={}, i=0, n=data.length; i<n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = (g = []);
        g.dims = k;
        groups.push(g);
      }
      g.push(field(t));
    }
  }

  return groups;
}

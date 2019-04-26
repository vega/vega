import {
  regressionLinear,
  regressionExp,
  regressionLog,
  regressionQuad,
  regressionPoly,
  regressionPow,
  regressionLoess
} from 'd3-regression';

import {ingest, Transform} from 'vega-dataflow';
import {accessorName, error, inherits} from 'vega-util';

const Methods = {
  'linear': regressionLinear,
  'exp': regressionExp,
  'log': regressionLog,
  'quad': regressionQuad,
  'poly': regressionPoly,
  'pow': regressionPow,
  'loess': regressionLoess
};

/**
 * Compute regression fits for one or more data groups.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.x - An accessor for the predictor data field.
 * @param {function(object): *} params.y - An accessor for the predicted data field.
 * @param {string} [params.method='linear'] - The regression method to apply.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {Array<number>} [params.extent] - The domain extent over which to plot the regression line.
 * @param {number} [params.bandwidth=0.3] - The loess bandwidth. Only applies to the 'loess' method.
 * @param {number} [params.order=3] - The polynomial order. Only applies to the 'poly' method.
 */
export default function Regression(params) {
  Transform.call(this, null, params);
}

Regression.Definition = {
  "type": "Regression",
  "metadata": {"generates": true},
  "params": [
    { "name": "x", "type": "field", "required": true },
    { "name": "y", "type": "field", "required": true },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "method", "type": "string", "default": "linear", "values": Object.keys(Methods) },
    { "name": "bandwidth", "type": "number", "default": 0.3 },
    { "name": "order", "type": "number", "default": 3 },
    { "name": "extent", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true }
  ]
};

var prototype = inherits(Regression, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);

  if (!this.value || pulse.changed() || _.modified()) {
    const source = pulse.materialize(pulse.SOURCE).source,
          groups = partition(source, _.groupby),
          names = (_.groupby || []).map(accessorName),
          method = _.method || 'linear',
          as = _.as || [accessorName(_.x), accessorName(_.y)],
          values = [];

    if (!Methods.hasOwnProperty(method)) {
      error('Invalid regression method: ' + method);
    }

    const fit = Methods[method]().x(_.x).y(_.y);
    if (method === 'loess' && _.bandwidth != null) {
      fit.bandwidth(_.bandwidth);
    } else if (method === 'poly' && _.order != null) {
      fit.order(_.order);
    }
    if (fit.domain && _.extent != null) {
      fit.domain(_.extent);
    }

    groups.forEach(g => {
      fit(g).forEach(p => {
        const t = {};
        for (let i=0; i<names.length; ++i) {
          t[names[i]] = g.dims[i];
        }
        t[as[0]] = p[0];
        t[as[1]] = p[1];
        values.push(ingest(t));
      });
    });

    if (this.value) out.rem = this.value;
    this.value = out.add = out.source = values;
  }

  return out;
};

function partition(data, groupby) {
  var groups = [],
      get = function(f) { return f(t); },
      map, i, n, t, k, g;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data);
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
      g.push(t);
    }
  }

  return groups;
}

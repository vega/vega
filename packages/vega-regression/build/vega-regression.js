(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-statistics'), require('vega-dataflow'), require('vega-util')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-statistics', 'vega-dataflow', 'vega-util'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega = {}, global.vega, global.vega, global.vega));
})(this, (function (exports, vegaStatistics, vegaDataflow, vegaUtil) { 'use strict';

  function partition (data, groupby) {
    var groups = [],
      get = function (f) {
        return f(t);
      },
      map,
      i,
      n,
      t,
      k,
      g;

    // partition data points into stack groups
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

  /**
   * Compute locally-weighted regression fits for one or more data groups.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.x - An accessor for the predictor data field.
   * @param {function(object): *} params.y - An accessor for the predicted data field.
   * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
   * @param {number} [params.bandwidth=0.3] - The loess bandwidth.
   */
  function Loess(params) {
    vegaDataflow.Transform.call(this, null, params);
  }
  Loess.Definition = {
    'type': 'Loess',
    'metadata': {
      'generates': true
    },
    'params': [{
      'name': 'x',
      'type': 'field',
      'required': true
    }, {
      'name': 'y',
      'type': 'field',
      'required': true
    }, {
      'name': 'groupby',
      'type': 'field',
      'array': true
    }, {
      'name': 'bandwidth',
      'type': 'number',
      'default': 0.3
    }, {
      'name': 'as',
      'type': 'string',
      'array': true
    }]
  };
  vegaUtil.inherits(Loess, vegaDataflow.Transform, {
    transform(_, pulse) {
      const out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
      if (!this.value || pulse.changed() || _.modified()) {
        const source = pulse.materialize(pulse.SOURCE).source,
          groups = partition(source, _.groupby),
          names = (_.groupby || []).map(vegaUtil.accessorName),
          m = names.length,
          as = _.as || [vegaUtil.accessorName(_.x), vegaUtil.accessorName(_.y)],
          values = [];
        groups.forEach(g => {
          vegaStatistics.regressionLoess(g, _.x, _.y, _.bandwidth || 0.3).forEach(p => {
            const t = {};
            for (let i = 0; i < m; ++i) {
              t[names[i]] = g.dims[i];
            }
            t[as[0]] = p[0];
            t[as[1]] = p[1];
            values.push(vegaDataflow.ingest(t));
          });
        });
        if (this.value) out.rem = this.value;
        this.value = out.add = out.source = values;
      }
      return out;
    }
  });

  const Methods = {
    constant: vegaStatistics.regressionConstant,
    linear: vegaStatistics.regressionLinear,
    log: vegaStatistics.regressionLog,
    exp: vegaStatistics.regressionExp,
    pow: vegaStatistics.regressionPow,
    quad: vegaStatistics.regressionQuad,
    poly: vegaStatistics.regressionPoly
  };
  const degreesOfFreedom = (method, order) => method === 'poly' ? order : method === 'quad' ? 2 : 1;

  /**
   * Compute regression fits for one or more data groups.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.x - An accessor for the predictor data field.
   * @param {function(object): *} params.y - An accessor for the predicted data field.
   * @param {string} [params.method='linear'] - The regression method to apply.
   * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
   * @param {Array<number>} [params.extent] - The domain extent over which to plot the regression line.
   * @param {number} [params.order=3] - The polynomial order. Only applies to the 'poly' method.
   */
  function Regression(params) {
    vegaDataflow.Transform.call(this, null, params);
  }
  Regression.Definition = {
    'type': 'Regression',
    'metadata': {
      'generates': true
    },
    'params': [{
      'name': 'x',
      'type': 'field',
      'required': true
    }, {
      'name': 'y',
      'type': 'field',
      'required': true
    }, {
      'name': 'groupby',
      'type': 'field',
      'array': true
    }, {
      'name': 'method',
      'type': 'string',
      'default': 'linear',
      'values': Object.keys(Methods)
    }, {
      'name': 'order',
      'type': 'number',
      'default': 3
    }, {
      'name': 'extent',
      'type': 'number',
      'array': true,
      'length': 2
    }, {
      'name': 'params',
      'type': 'boolean',
      'default': false
    }, {
      'name': 'as',
      'type': 'string',
      'array': true
    }]
  };
  vegaUtil.inherits(Regression, vegaDataflow.Transform, {
    transform(_, pulse) {
      const out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
      if (!this.value || pulse.changed() || _.modified()) {
        const source = pulse.materialize(pulse.SOURCE).source,
          groups = partition(source, _.groupby),
          names = (_.groupby || []).map(vegaUtil.accessorName),
          method = _.method || 'linear',
          order = _.order == null ? 3 : _.order,
          dof = degreesOfFreedom(method, order),
          as = _.as || [vegaUtil.accessorName(_.x), vegaUtil.accessorName(_.y)],
          fit = Methods[method],
          values = [];
        let domain = _.extent;
        if (!vegaUtil.hasOwnProperty(Methods, method)) {
          vegaUtil.error('Invalid regression method: ' + method);
        }
        if (domain != null) {
          if (method === 'log' && domain[0] <= 0) {
            pulse.dataflow.warn('Ignoring extent with values <= 0 for log regression.');
            domain = null;
          }
        }
        groups.forEach(g => {
          const n = g.length;
          if (n <= dof) {
            pulse.dataflow.warn('Skipping regression with more parameters than data points.');
            return;
          }
          const model = fit(g, _.x, _.y, order);
          if (_.params) {
            // if parameter vectors requested return those
            values.push(vegaDataflow.ingest({
              keys: g.dims,
              coef: model.coef,
              rSquared: model.rSquared
            }));
            return;
          }
          const dom = domain || vegaUtil.extent(g, _.x),
            add = p => {
              const t = {};
              for (let i = 0; i < names.length; ++i) {
                t[names[i]] = g.dims[i];
              }
              t[as[0]] = p[0];
              t[as[1]] = p[1];
              values.push(vegaDataflow.ingest(t));
            };
          if (method === 'linear' || method === 'constant') {
            // for linear or constant regression we only need the end points
            dom.forEach(x => add([x, model.predict(x)]));
          } else {
            // otherwise return trend line sample points
            vegaStatistics.sampleCurve(model.predict, dom, 25, 200).forEach(add);
          }
        });
        if (this.value) out.rem = this.value;
        this.value = out.add = out.source = values;
      }
      return out;
    }
  });

  exports.loess = Loess;
  exports.regression = Regression;

}));

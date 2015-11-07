var dl = require('datalib'),
    log = require('vega-logging'),
    Tuple = require('vega-dataflow').Tuple,
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Impute(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    groupby: {type: 'array<field>'},
    orderby: {type: 'array<field>'},
    field:   {type: 'field'},
    method:  {type: 'value', default: 'value'},
    value:   {type: 'value', default: 0}
  });

  return this.router(true).produces(true);
}

var prototype = (Impute.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Impute;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['imputing']);

  var groupby = this.param('groupby'),
      orderby = this.param('orderby'),
      method = this.param('method'),
      value = this.param('value'),
      field = this.param('field'),
      get = field.accessor,
      name = field.field,
      prev = this._imputed || [], curr = [],
      groups = partition(data, groupby.accessor, orderby.accessor),
      domain = groups.domain,
      group, i, j, n, m, t;

  function getval(x) {
    return x == null ? null : get(x);
  }

  for (j=0, m=groups.length; j<m; ++j) {
    group = groups[j];

    // determine imputation value
    if (method !== 'value') {
      value = dl[method](group, getval);
    }

    // add tuples for missing values
    for (i=0, n=group.length; i<n; ++i) {
      if (group[i] == null) {
        t = tuple(groupby.field, group.values, orderby.field, domain[i]);
        t[name] = value;
        curr.push(t);
      }
    }
  }

  // update changeset with imputed tuples
  for (i=0, n=curr.length; i<n; ++i) {
    input.add.push(curr[i]);
  }
  for (i=0, n=prev.length; i<n; ++i) {
    input.rem.push(prev[i]);
  }
  this._imputed = curr;

  return input;
};

function tuple(gb, gv, ob, ov) {
  var t = {_imputed: true}, i;
  for (i=0; i<gv.length; ++i) t[gb[i]] = gv[i];
  for (i=0; i<ov.length; ++i) t[ob[i]] = ov[i];
  return Tuple.ingest(t);
}

function partition(data, groupby, orderby) {
  var groups = [],
      get = function(f) { return f(x); },
      val = function(d) { return (x=d, orderby.map(get)); },
      map, i, x, k, g, domain, lut, N;

  domain = groups.domain = dl.unique(data, val);
  N = domain.length;
  lut = domain.reduce(function(m, d, i) {
    return (m[d] = {value:d, index:i}, m);
  }, {});

  // partition data points into groups
  for (map={}, i=0; i<data.length; ++i) {
    x = data[i];
    k = groupby == null ? [] : groupby.map(get);
    g = map[k] || (groups.push(map[k] = Array(N)), map[k].values = k, map[k]);
    g[lut[val(x)].index] = x;
  }

  return groups;
}

module.exports = Impute;

Impute.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Impute transform",
  "description": "Performs imputation of missing values.",
  "type": "object",
  "properties": {
    "type": {"enum": ["impute"]},
    "method": {
      "description": "The imputation method to use.",
      "oneOf": [
        {"enum": ["value", "mean", "median", "min", "max"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "value"
    },
    "value": {
      "description": "The value to use for missing data if the method is 'value'.",
      "oneOf": [
        {"type": "number"},
        {"type": "string"},
        {"type": "boolean"},
        {"type": "null"},
        {"$ref": "#/refs/signal"}
      ],
      "default": 0
    },
    "field": {
      "description": "The data field to impute.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "groupby": {
      "description": "A list of fields to group the data into series.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
    },
    "orderby": {
      "description": "A list of fields to determine ordering within series.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
    }
  },
  "additionalProperties": false,
  "required": ["type", "groupby", "orderby", "field"]
};

var dl = require('datalib'),
    Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Stack(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    groupby: {type: 'array<field>'},
    sortby: {type: 'array<field>'},
    field: {type: 'field'},
    offset: {type: 'value', default: 'zero'}
  });

  this._output = {
    'start': 'layout_start',
    'end':   'layout_end',
    'mid':   'layout_mid'
  };
  return this.mutates(true);
}

var prototype = (Stack.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Stack;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['stacking']);

  var groupby = this.param('groupby').accessor,
      sortby = dl.comparator(this.param('sortby').field),
      field = this.param('field').accessor,
      offset = this.param('offset'),
      output = this._output;

  // partition, sum, and sort the stack groups
  var groups = partition(data, groupby, sortby, field);

  // compute stack layouts per group
  for (var i=0, max=groups.max; i<groups.length; ++i) {
    var group = groups[i],
        sum = group.sum,
        off = offset==='center' ? (max - sum)/2 : 0,
        scale = offset==='normalize' ? (1/sum) : 1,
        j, x, a, b = off, v = 0;

    // set stack coordinates for each datum in group
    for (j=0; j<group.length; ++j) {
      x = group[j];
      a = b; // use previous value for start point
      v += field(x);
      b = scale * v + off; // compute end point
      Tuple.set(x, output.start, a);
      Tuple.set(x, output.end, b);
      Tuple.set(x, output.mid, 0.5 * (a + b));
    }
  }

  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
  input.fields[output.mid] = 1;
  return input;
};

function partition(data, groupby, sortby, field) {
  var groups = [],
      get = function(f) { return f(x); },
      map, i, x, k, g, s, max;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map={}, i=0; i<data.length; ++i) {
      x = data[i];
      k = groupby.map(get);
      g = map[k] || (groups.push(map[k] = []), map[k]);
      g.push(x);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k=0, max=0; k<groups.length; ++k) {
    g = groups[k];
    for (i=0, s=0; i<g.length; ++i) {
      s += field(g[i]);
    }
    g.sum = s;
    if (s > max) max = s;
    if (sortby != null) g.sort(sortby);
  }
  groups.max = max;

  return groups;
}

module.exports = Stack;

Stack.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Stack transform",
  "description": "Computes layout values for stacked graphs, as in stacked bar charts or stream graphs.",
  "type": "object",
  "properties": {
    "type": {"enum": ["stack"]},
    "groupby": {
      "description": "A list of fields to split the data into groups (stacks).",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
    },
    "sortby": {
      "description": "A list of fields to determine the sort order of stacks.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
    },
    "field": {
      "description": "The data field that determines the thickness/height of stacks.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "offset": {
      "description": "The baseline offset",
      "oneOf": [{"enum": ["zero", "center", "normalize"]}, {"$ref": "#/refs/signal"}],
      "default": "zero"
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "start": {"type": "string", "default": "layout_start"},
        "end": {"type": "string", "default": "layout_end"},
        "mid": {"type": "string", "default": "layout_mid"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type", "groupby", "field"]
};

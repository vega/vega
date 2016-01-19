var Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Rank(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field: {type: 'field', default: null},
    normalize: {type: 'value', default: false}
  });

  this._output = {
    'rank': 'rank'
  };

  return this.mutates(true);
}

var prototype = (Rank.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Rank;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['rank']);

  var rank  = this._output.rank,
      norm  = this.param('normalize'),
      field = this.param('field').accessor,
      l = {}, i = 0, len = data.length, r, d;

  for (; i<len; ++i) {
    r = norm ? (i+1)/len : i+1;
    if (field) {
      Tuple.set(d=data[i], rank, l[d=field(d)] || (l[d]=r));
    } else {
      Tuple.set(data[i], rank, r);
    }
  }

  input.fields[rank] = 1;
  return input;
};

module.exports = Rank;

Rank.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Rank transform",
  "description": "Computes ascending rank scores for data tuples.",
  "type": "object",
  "properties": {
    "type": {"enum": ["rank"]},
    "field": {
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "A key field to used to rank tuples. " +
        "If undefined, tuples will be ranked in their observed order."
    },
    "normalize": {
      "description": "If true, values of the output field will lie in the range [0, 1].",
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "default": false
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "rank": {"type": "string", "default": "rank"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

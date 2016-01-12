var Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Rank(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    start: {type: 'value', default: 1},
    step:  {type: 'value', default: 1},
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

  var rank = this._output.rank,
      len   = data.length,
      norm  = this.param('normalize'),
      step  = norm ? 1/len : this.param('step'),
      value = (norm ? 0 : this.param('start')) - step;

  for (var i = 0; i<len; ++i) {
    Tuple.set(data[i], rank, value+=step);
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
    "start": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 1
    },
    "step": {
      "oneOf": [{
        "type": "number", "minimum": 0, "exclusiveMinimum": true,
      }, {"$ref": "#/refs/signal"}],
      "default": 1
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

var dl = require('datalib'),
    log  = require('vega-logging'),
    Transform = require('./Transform');

function Sort(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {by: {type: 'array<field>'} });
  this.router(true);
}

var prototype = (Sort.prototype = Object.create(Transform.prototype));
prototype.constructor = Sort;

prototype.transform = function(input) {
  log.debug(input, ['sorting']);

  if (input.add.length || input.mod.length || input.rem.length) {
    input.sort = dl.comparator(this.param('by').field);
  }
  return input;
};

module.exports = Sort;

Sort.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Sort transform",
  "description": "Sorts the values of a data set.",
  "type": "object",
  "properties": {
    "type": {"enum": ["sort"]},
    "by": {
      "oneOf": [
        {"type": "string"},
        {"type": "array", "items": {"type": "string"}}
      ],
      "description": "A list of fields to use as sort criteria."
    }
  },
  "required": ["type", "by"]
};

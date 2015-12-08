var df = require('vega-dataflow'),
    log = require('vega-logging'),
    Transform = require('./Transform');

function Filter(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {test: {type: 'expr'}});

  this._skip = {};
  return this.router(true);
}

var prototype = (Filter.prototype = Object.create(Transform.prototype));
prototype.constructor = Filter;

prototype.transform = function(input) {
  log.debug(input, ['filtering']);

  var output = df.ChangeSet.create(input),
      skip = this._skip,
      test = this.param('test');

  input.rem.forEach(function(x) {
    if (skip[x._id] !== 1) output.rem.push(x);
    else skip[x._id] = 0;
  });

  input.add.forEach(function(x) {
    if (test(x)) output.add.push(x);
    else skip[x._id] = 1;
  });

  input.mod.forEach(function(x) {
    var b = test(x),
        s = (skip[x._id] === 1);
    if (b && s) {
      skip[x._id] = 0;
      output.add.push(x);
    } else if (b && !s) {
      output.mod.push(x);
    } else if (!b && s) {
      // do nothing, keep skip true
    } else { // !b && !s
      output.rem.push(x);
      skip[x._id] = 1;
    }
  });

  return output;
};

module.exports = Filter;

Filter.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Filter transform",
  "description": "Filters elements from a data set to remove unwanted items.",
  "type": "object",
  "properties": {
    "type": {"enum": ["filter"]},
    "test": {
      "type": "string",
      "description": "A string containing an expression (in JavaScript syntax) for the filter predicate."
    }
  },
  "additionalProperties": false,
  "required": ["type", "test"]
};

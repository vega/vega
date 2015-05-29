var Transform = require('./Transform'),
    log = require('../util/log'), 
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset');

function Fold(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    fields: {type: "array<field>"} 
  });

  this._output = {key: "key", value: "value"};
  this._cache = {};

  return this.router(true).revises(true);
}

var proto = (Fold.prototype = new Transform());

function rst(input, output) { 
  for(var id in this._cache) output.rem.push.apply(output.rem, this._cache[id]);
  this._cache = {};
};

function get_tuple(x, i, len) {
  var list = this._cache[x._id] || (this._cache[x._id] = Array(len));
  return list[i] || (list[i] = tuple.derive(x, x._prev));
};

function fn(data, fields, accessors, out, stamp) {
  var i = 0, dlen = data.length,
      j, flen = fields.length,
      d, t;

  for(; i<dlen; ++i) {
    d = data[i];
    for(j=0; j<flen; ++j) {
      t = get_tuple.call(this, d, j, flen);  
      tuple.set(t, this._output.key, fields[j]);
      tuple.set(t, this._output.value, accessors[j](d));
      out.push(t);
    }      
  }
};

proto.transform = function(input, reset) {
  log.debug(input, ["folding"]);

  var fold = this,
      on = this.param('fields'),
      output = changeset.create(input);

  if(reset) rst.call(this, input, output);

  fn.call(this, input.add, on.field, on.accessor, output.add, input.stamp);
  fn.call(this, input.mod, on.field, on.accessor, reset ? output.add : output.mod, input.stamp);
  input.rem.forEach(function(x) {
    output.rem.push.apply(output.rem, fold._cache[x._id]);
    fold._cache[x._id] = null;
  });

  // If we're only propagating values, don't mark key/value as updated.
  if(input.add.length || input.rem.length || 
    on.field.some(function(f) { return !!input.fields[f]; }))
      output.fields[this._output.key] = 1, output.fields[this._output.value] = 1;
  return output;
};

module.exports = Fold;
Fold.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Fold transform",
  "description": "Collapse (\"fold\") one or more data properties into two properties.",
  "type": "object",
  "properties": {
    "type": {"enum": ["fold"]},
    "fields": {
      "type": "array",
      "description": "An array of field references indicating the data properties to fold.",
      "items": {"type": "string"},
      "minItems": 1,
      "uniqueItems": true
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "key": {"type": "string", "default": "key"},
        "value": {"type": "string", "default": "value"}
      }
    }
  },
  "required": ["type", "fields"]
};
